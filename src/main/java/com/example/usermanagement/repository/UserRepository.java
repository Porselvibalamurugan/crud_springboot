package com.example.usermanagement.repository;

import com.example.usermanagement.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    
    Optional<User> findByEmail(String email);
    
    @Query("{'firstName': {$regex: ?0, $options: 'i'}}")
    List<User> findByFirstNameContainingIgnoreCase(String firstName);
    
    @Query("{'lastName': {$regex: ?0, $options: 'i'}}")
    List<User> findByLastNameContainingIgnoreCase(String lastName);
    
    @Query("{'city': {$regex: ?0, $options: 'i'}}")
    List<User> findByCityContainingIgnoreCase(String city);
    
    @Query("{'country': {$regex: ?0, $options: 'i'}}")
    List<User> findByCountryContainingIgnoreCase(String country);
    
    boolean existsByEmail(String email);
}