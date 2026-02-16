package in.temple.backend.util;

import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;

import java.io.ByteArrayOutputStream;

public class ReceiptGenerator {

    public static byte[] generateReceipt(String donorName,
                                         Double amount,
                                         String receiptNumber) {

        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();

            PdfWriter writer = new PdfWriter(out);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            document.add(new Paragraph("TEMPLE DONATION RECEIPT"));
            document.add(new Paragraph("----------------------------------"));
            document.add(new Paragraph("Receipt No: " + receiptNumber));
            document.add(new Paragraph("Donor Name: " + donorName));
            document.add(new Paragraph("Amount: ₹" + amount));
            document.add(new Paragraph("Thank you for your donation!"));

            document.close();

            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Error generating receipt", e);
        }
    }
}
