package in.temple.backend.repository.spec;

import in.temple.backend.model.Donation;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public class DonationSpecifications {

    public static Specification<Donation> active(boolean active) {
        return (root, query, cb) ->
                cb.equal(root.get("active"), active);
    }

    public static Specification<Donation> createdBy(String username) {
        return (root, query, cb) ->
                username == null ? null :
                        cb.equal(root.get("createdBy"), username);
    }

    public static Specification<Donation> purposeId(Long purposeId) {
        return (root, query, cb) ->
                purposeId == null ? null :
                        cb.equal(root.get("purposeId"), purposeId);
    }

    public static Specification<Donation> fromDate(LocalDateTime from) {
        return (root, query, cb) ->
                from == null ? null :
                        cb.greaterThanOrEqualTo(
                                root.get("createdAt"), from);
    }

    public static Specification<Donation> toDate(LocalDateTime to) {
        return (root, query, cb) ->
                to == null ? null :
                        cb.lessThanOrEqualTo(
                                root.get("createdAt"), to);
    }
}
