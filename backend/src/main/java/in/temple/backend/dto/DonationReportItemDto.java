package in.temple.backend.dto;

import in.temple.backend.model.Donation;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DonationReportItemDto(
        Long id,
        String receiptNumber,
        String donorName,
        String mobile,
        String purposeNameEn,
        String purposeNameHi,
        BigDecimal amount,
        String gotraNameEn,
        String gotraNameHi,
        String createdBy,
        LocalDateTime createdAt
) {

    public static DonationReportItemDto fromEntity(Donation d) {
        return new DonationReportItemDto(
                d.getId(),
                d.getReceiptNumber(),
                d.getDonorName(),
                d.getMobile(),
                d.getPurposeNameEn(),
                d.getPurposeNameHi(),
                d.getAmount(),
                d.getGotraNameEn(),
                d.getGotraNameHi(),
                d.getCreatedBy(),
                d.getCreatedAt()
        );
    }
}
