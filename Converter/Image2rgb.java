import java.io.IOException;
import javax.imageio.ImageIO;
import java.io.File;
import java.awt.image.BufferedImage;



public class Image2rgb {

public static final String IMG = "medical-scales-rbs.png";

public static void main(String[] args) {

    BufferedImage img;

    try {
        img = ImageIO.read(new File(IMG));
        int[] rgb;

        for(int i = 0; i < img.getWidth(); i++){
            rgb = getPixelData(img, i, img.getHeight()/2);
        }


    } catch (IOException e) {
        e.printStackTrace();
    }

}

private static int[] getPixelData(BufferedImage img, int x, int y) {
int argb = img.getRGB(x, y);

int rgb[] = new int[] {
    (argb >> 16) & 0xff, //red
    (argb >>  8) & 0xff, //green
    (argb      ) & 0xff  //blue
};

System.out.println("" + rgb[0] + " " + rgb[1] + " " + rgb[2]);
return rgb;
}

}