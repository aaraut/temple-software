package in.temple.backend.util;

import java.math.BigDecimal;

public class HindiNumberUtil {

    private static final String[] units = {
            "", "एक", "दो", "तीन", "चार", "पाँच", "छह", "सात", "आठ", "नौ",
            "दस", "ग्यारह", "बारह", "तेरह", "चौदह", "पंद्रह", "सोलह",
            "सत्रह", "अठारह", "उन्नीस"
    };

    private static final String[] tens = {
            "", "", "बीस", "तीस", "चालीस", "पचास",
            "साठ", "सत्तर", "अस्सी", "नब्बे"
    };

    public static String convert(BigDecimal amount) {
        int number = amount.intValue();
        return convertNumber(number) + " रुपये मात्र";
    }

    private static String convertNumber(int number) {

        if (number == 0) return "शून्य";

        if (number < 20)
            return units[number];

        if (number < 100)
            return tens[number / 10] +
                    (number % 10 != 0 ? " " + units[number % 10] : "");

        if (number < 1000)
            return units[number / 100] + " सौ" +
                    (number % 100 != 0 ? " " + convertNumber(number % 100) : "");

        if (number < 100000)
            return convertNumber(number / 1000) + " हजार" +
                    (number % 1000 != 0 ? " " + convertNumber(number % 1000) : "");

        return String.valueOf(number);
    }
}