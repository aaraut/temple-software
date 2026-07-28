package in.temple.backend.util;

import java.math.BigDecimal;

public class HindiNumberUtil {

    // Complete 1-99 lookup — Hindi numbers do NOT follow a simple tens+units
    // pattern (e.g. 21 = इक्कीस, not बीस एक; 55 = पचपन, not पचास पाँच).
    private static final String[] ONES = {
            "", "एक", "दो", "तीन", "चार", "पाँच", "छह", "सात", "आठ", "नौ",
            "दस", "ग्यारह", "बारह", "तेरह", "चौदह", "पंद्रह", "सोलह", "सत्रह", "अठारह", "उन्नीस",
            "बीस", "इक्कीस", "बाईस", "तेईस", "चौबीस", "पच्चीस", "छब्बीस", "सत्ताईस", "अट्ठाईस", "उनतीस",
            "तीस", "इकतीस", "बत्तीस", "तैंतीस", "चौंतीस", "पैंतीस", "छत्तीस", "सैंतीस", "अड़तीस", "उनतालीस",
            "चालीस", "इकतालीस", "बयालीस", "तैंतालीस", "चवालीस", "पैंतालीस", "छयालीस", "सैंतालीस", "अड़तालीस", "उनचास",
            "पचास", "इक्यावन", "बावन", "तिरपन", "चौवन", "पचपन", "छप्पन", "सत्तावन", "अट्ठावन", "उनसठ",
            "साठ", "इकसठ", "बासठ", "तिरसठ", "चौंसठ", "पैंसठ", "छियासठ", "सड़सठ", "अड़सठ", "उनहत्तर",
            "सत्तर", "इकहत्तर", "बहत्तर", "तिहत्तर", "चौहत्तर", "पचहत्तर", "छिहत्तर", "सतहत्तर", "अठहत्तर", "उनासी",
            "अस्सी", "इक्यासी", "बयासी", "तिरासी", "चौरासी", "पचासी", "छियासी", "सत्तासी", "अट्ठासी", "नवासी",
            "नब्बे", "इक्यानवे", "बानवे", "तिरानवे", "चौरानवे", "पचानवे", "छियानवे", "सत्तानवे", "अट्ठानवे", "निन्यानवे"
    };

    public static String convert(BigDecimal amount) {
        int number = amount.intValue();
        return convertNumber(number) + " रुपये मात्र";
    }

    private static String convertNumber(int number) {

        if (number == 0) return "शून्य";

        if (number < 100)
            return ONES[number];

        if (number < 1000)
            return ONES[number / 100] + " सौ" +
                    (number % 100 != 0 ? " " + convertNumber(number % 100) : "");

        if (number < 100000)
            return convertNumber(number / 1000) + " हजार" +
                    (number % 1000 != 0 ? " " + convertNumber(number % 1000) : "");

        if (number < 10000000)
            return convertNumber(number / 100000) + " लाख" +
                    (number % 100000 != 0 ? " " + convertNumber(number % 100000) : "");

        return String.valueOf(number);
    }

    // ── English (Indian numbering: thousand/lakh) amount-in-words ──────────────
    private static final String[] ONES_EN = {
            "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
            "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
            "Seventeen", "Eighteen", "Nineteen"
    };
    private static final String[] TENS_EN = {
            "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    };

    public static String convertEnglish(BigDecimal amount) {
        int number = amount.intValue();
        return convertNumberEnglish(number) + " Rupees Only";
    }

    private static String convertNumberEnglish(int number) {

        if (number == 0) return "Zero";

        if (number < 20)
            return ONES_EN[number];

        if (number < 100)
            return TENS_EN[number / 10] + (number % 10 != 0 ? " " + ONES_EN[number % 10] : "");

        if (number < 1000)
            return ONES_EN[number / 100] + " Hundred" +
                    (number % 100 != 0 ? " " + convertNumberEnglish(number % 100) : "");

        if (number < 100000)
            return convertNumberEnglish(number / 1000) + " Thousand" +
                    (number % 1000 != 0 ? " " + convertNumberEnglish(number % 1000) : "");

        if (number < 10000000)
            return convertNumberEnglish(number / 100000) + " Lakh" +
                    (number % 100000 != 0 ? " " + convertNumberEnglish(number % 100000) : "");

        return String.valueOf(number);
    }
}
