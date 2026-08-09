package com.clinic.management.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.validation.BindingResult;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.*;
import java.util.regex.Pattern;

@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class RequestResponseLoggingAspect {

    private final ObjectMapper objectMapper;

    private static final Pattern SENSITIVE_PATTERN = Pattern.compile("(?i)\"(password|token|secret|oldpassword|newpassword)\"\\s*:\\s*\"[^\"]*\"");

    @Pointcut("within(@org.springframework.web.bind.annotation.RestController *) || within(@org.springframework.stereotype.Controller *)")
    public void controllerPointcut() {
    }

    @Around("controllerPointcut()")
    public Object logRequestAndResponse(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();

        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        HttpServletRequest request = attributes != null ? attributes.getRequest() : null;

        String httpMethod = request != null ? request.getMethod() : "UNKNOWN";
        String requestURI = request != null ? request.getRequestURI() : "UNKNOWN";
        String queryString = (request != null && request.getQueryString() != null) ? "?" + request.getQueryString() : "";
        String clientIp = getClientIp(request);

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String className = signature.getDeclaringType().getSimpleName();
        String methodName = signature.getName();

        String maskedArgs = getMaskedArgs(signature.getParameterNames(), joinPoint.getArgs());

        log.info("==> HTTP [{}] {}{} | Handler: {}.{}() | Client IP: {} | Payload: {}",
                httpMethod, requestURI, queryString, className, methodName, clientIp, maskedArgs);

        Object result;
        try {
            result = joinPoint.proceed();
        } catch (Throwable ex) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("<== HTTP [{}] {}{} | FAILED in {}ms | Exception: {} - {}",
                    httpMethod, requestURI, queryString, duration, ex.getClass().getSimpleName(), ex.getMessage());
            throw ex;
        }

        long duration = System.currentTimeMillis() - startTime;
        int status = getHttpStatus(result, attributes);
        String maskedResponse = getMaskedResponse(result);

        log.info("<== HTTP [{}] {}{} | Status: {} | Time: {}ms | Response: {}",
                httpMethod, requestURI, queryString, status, duration, maskedResponse);

        return result;
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) return "UNKNOWN";
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String getMaskedArgs(String[] paramNames, Object[] args) {
        if (args == null || args.length == 0) {
            return "[]";
        }
        Map<String, Object> paramsMap = new LinkedHashMap<>();
        for (int i = 0; i < args.length; i++) {
            Object arg = args[i];
            if (shouldSkipArg(arg)) {
                continue;
            }
            String paramName = (paramNames != null && i < paramNames.length) ? paramNames[i] : "arg" + i;
            paramsMap.put(paramName, arg);
        }
        try {
            String json = objectMapper.writeValueAsString(paramsMap);
            return maskSensitiveJson(json);
        } catch (Exception e) {
            return paramsMap.toString();
        }
    }

    private String getMaskedResponse(Object result) {
        if (result == null) {
            return "null";
        }
        Object body = result;
        if (result instanceof ResponseEntity<?> responseEntity) {
            body = responseEntity.getBody();
        }
        if (body == null) {
            return "null";
        }
        try {
            String json = objectMapper.writeValueAsString(body);
            // Truncate excessively long responses (e.g. lists of > 2000 chars) for clean log readability
            if (json.length() > 1500) {
                json = json.substring(0, 1500) + "... [truncated " + (json.length() - 1500) + " chars]";
            }
            return maskSensitiveJson(json);
        } catch (Exception e) {
            return body.toString();
        }
    }

    private int getHttpStatus(Object result, ServletRequestAttributes attributes) {
        if (result instanceof ResponseEntity<?> responseEntity) {
            return responseEntity.getStatusCode().value();
        }
        if (attributes != null && attributes.getResponse() != null) {
            return attributes.getResponse().getStatus();
        }
        return 200;
    }

    private boolean shouldSkipArg(Object arg) {
        return arg == null ||
                arg instanceof HttpServletRequest ||
                arg instanceof HttpServletResponse ||
                arg instanceof Authentication ||
                arg instanceof BindingResult;
    }

    private String maskSensitiveJson(String json) {
        if (json == null) return null;
        return SENSITIVE_PATTERN.matcher(json).replaceAll("\"$1\":\"***MASKED***\"");
    }
}
