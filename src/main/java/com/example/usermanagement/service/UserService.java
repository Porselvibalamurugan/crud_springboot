package com.example.usermanagement.service;

import com.example.usermanagement.model.User;
import com.example.usermanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    // Get all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    // Get user by ID
    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }
    
    // Get user by email
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    // Save user
    public User saveUser(User user) {
        return userRepository.save(user);
    }
    
    // Update user
    public User updateUser(String id, User userDetails) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            user.setFirstName(userDetails.getFirstName());
            user.setLastName(userDetails.getLastName());
            user.setEmail(userDetails.getEmail());
            user.setPhoneNumber(userDetails.getPhoneNumber());
            user.setAddress(userDetails.getAddress());
            user.setCity(userDetails.getCity());
            user.setCountry(userDetails.getCountry());
            return userRepository.save(user);
        }
        return null;
    }
    
    // Delete user
    public boolean deleteUser(String id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }
    
    // Check if email exists
    public boolean emailExists(String email) {
        return userRepository.existsByEmail(email);
    }
    
    // Check if email exists for different user (for updates)
    public boolean emailExistsForDifferentUser(String email, String userId) {
        Optional<User> user = userRepository.findByEmail(email);
        return user.isPresent() && !user.get().getId().equals(userId);
    }
    
    // Search users
    public List<User> searchUsers(String searchTerm) {
        // This is a simple implementation - you could make it more sophisticated
        List<User> users = userRepository.findByFirstNameContainingIgnoreCase(searchTerm);
        users.addAll(userRepository.findByLastNameContainingIgnoreCase(searchTerm));
        users.addAll(userRepository.findByCityContainingIgnoreCase(searchTerm));
        users.addAll(userRepository.findByCountryContainingIgnoreCase(searchTerm));
        return users.stream().distinct().toList();
    }
}