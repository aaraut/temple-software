package in.temple.backend.repository;

import in.temple.backend.model.TransactionAbhishekDetails;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TransactionAbhishekDetailsRepository
        extends JpaRepository<TransactionAbhishekDetails, Long> {

    Optional<TransactionAbhishekDetails> findByTransactionId(Long transactionId);
}
