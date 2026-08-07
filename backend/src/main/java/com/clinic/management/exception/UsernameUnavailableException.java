package com.clinic.management.exception;

import lombok.Getter;
import java.util.List;

@Getter
public class UsernameUnavailableException extends RuntimeException {
    private final String username;
    private final List<String> suggestions;

    public UsernameUnavailableException(String username, List<String> suggestions) {
        super("Username '" + username + "' is already taken.");
        this.username = username;
        this.suggestions = suggestions;
    }
}
