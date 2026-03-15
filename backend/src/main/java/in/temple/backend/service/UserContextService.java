package in.temple.backend.service;

public interface UserContextService {

    char getUserFirstInitial(String username);

    char getUserLastInitial(String username);

    boolean isAdmin(String username);
}
