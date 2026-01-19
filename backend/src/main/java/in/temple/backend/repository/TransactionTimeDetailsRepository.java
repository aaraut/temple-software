package in.temple.backend.repository;

import in.temple.backend.model.TransactionTimeDetails;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TransactionTimeDetailsRepository
        extends JpaRepository<TransactionTimeDetails, Long> {

    Optional<TransactionTimeDetails> findByTransactionId(Long transactionId);
}
