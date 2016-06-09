package colorFiles;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileReader;
import java.io.FileWriter;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.Hashtable;

import javax.swing.JOptionPane;



public class Converter{
	public static void main(String[] args){
		String fileName=JOptionPane.showInputDialog("Enter input filename:");
		String output=JOptionPane.showInputDialog("Enter output filename:");
		//Read the file
		try{
		    BufferedReader reader = new BufferedReader(new FileReader(fileName));
		    BufferedWriter bw = new BufferedWriter(new FileWriter(output));
		    String line;
		    reader.readLine(); //Throw out the first line
		    while ((line = reader.readLine()) != null)
		    {
		    	String[] temp = line.split(",");
		    	System.out.println(""+temp[1]+" "+temp[2]+" "+temp[3]);
		    	bw.write(""+temp[1]+" "+temp[2]+" "+temp[3]+"\n");
		    	bw.flush();
		    }
		    
			
			//Write the results
		    bw.flush();
			
			bw.close();
			reader.close();
		}
		catch (Exception e){
		    e.printStackTrace();
		}
	}
}