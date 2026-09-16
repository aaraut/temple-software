package in.temple.backend.util;

import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.font.FontRenderContext;
import java.awt.font.LineBreakMeasurer;
import java.awt.font.TextAttribute;
import java.awt.font.TextLayout;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.text.AttributedString;

/**
 * Shared plumbing for the A5, image-based receipt PDFs (donation, rental,
 * room booking, UPI donation). Java AWT's TextLayout uses the JVM's built-in
 * HarfBuzz shaper, which correctly shapes Devanagari conjuncts/matras —
 * OpenPDF/openhtmltopdf do NOT do this shaping, which is why Hindi text
 * appeared scrambled when those were tried directly.
 */
public final class ReceiptPdfUtil {

    private ReceiptPdfUtil() {}

    public static Font loadDevanagariFont() throws Exception {
        try (InputStream fontStream = ReceiptPdfUtil.class.getClassLoader()
                .getResourceAsStream("fonts/NotoSansDevanagari-Regular.ttf")) {
            if (fontStream == null) {
                throw new RuntimeException("NotoSansDevanagari-Regular.ttf not found in resources/fonts/");
            }
            return Font.createFont(Font.TRUETYPE_FONT, fontStream);
        }
    }

    /** Draw text via TextLayout — applies HarfBuzz shaping for correct Devanagari. */
    public static void drawLine(Graphics2D g, String text, int x, int y,
                                 Font font, FontRenderContext frc) {
        if (text == null || text.isEmpty()) return;
        new TextLayout(text, font, frc).draw(g, x, y);
    }

    /**
     * Draw text wrapped at word boundaries to fit maxWidth, instead of running
     * past the bitmap edge and getting silently clipped. Returns the y
     * position ready for the next line after the wrapped block.
     */
    public static int drawWrapped(Graphics2D g, String text, int x, int y, int maxWidth,
                                   Font font, FontRenderContext frc, int lineHeight) {
        if (text == null || text.isEmpty()) return y;

        AttributedString attrText = new AttributedString(text);
        attrText.addAttribute(TextAttribute.FONT, font);
        LineBreakMeasurer measurer = new LineBreakMeasurer(attrText.getIterator(), frc);

        int curY = y;
        while (measurer.getPosition() < text.length()) {
            TextLayout layout = measurer.nextLayout(maxWidth);
            layout.draw(g, x, curY);
            curY += lineHeight;
        }
        return curY;
    }

    /** Embeds a full-bleed A5 image as the single page of a new PDF. */
    public static byte[] imageToA5Pdf(BufferedImage img) throws Exception {
        ByteArrayOutputStream imgOut = new ByteArrayOutputStream();
        javax.imageio.ImageIO.write(img, "png", imgOut);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        com.lowagie.text.Document document =
                new com.lowagie.text.Document(com.lowagie.text.PageSize.A5, 0, 0, 0, 0);

        com.lowagie.text.pdf.PdfWriter.getInstance(document, out);
        document.open();

        com.lowagie.text.Image pdfImg = com.lowagie.text.Image.getInstance(imgOut.toByteArray());
        pdfImg.scaleToFit(com.lowagie.text.PageSize.A5.getWidth(), com.lowagie.text.PageSize.A5.getHeight());
        pdfImg.setAbsolutePosition(0, 0);
        document.add(pdfImg);
        document.close();

        return out.toByteArray();
    }
}
