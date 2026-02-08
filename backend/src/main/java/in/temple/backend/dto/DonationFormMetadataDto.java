package in.temple.backend.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DonationFormMetadataDto {

    private List<String> languages;
    private List<String> paymentTypes;
    private List<PurposeDto> purposes;
    private List<GotraDto> gotras;

    @Getter @Setter
    public static class PurposeDto {
        private Long id;
        private String nameEn;
        private String nameHi;
        private BigDecimal fixedAmount;
        private boolean requiresGotra;
    }

    @Getter @Setter
    public static class GotraDto {
        private String id;        // e.g. "Kashyap"
        private String nameEn;
        private String nameHi;
        private boolean isDefault;
    }
}
