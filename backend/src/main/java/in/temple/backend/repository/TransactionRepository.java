package in.temple.backend.repository;

import in.temple.backend.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByReceiptNumber(String receiptNumber);
}
