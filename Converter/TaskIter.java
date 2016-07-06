package TaskIter;

//Wesley Chiou

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.Hashtable;

import javax.swing.JOptionPane;

public class TaskIter{
	static Hashtable<String,ArrayList<String>> labels = new Hashtable<String,ArrayList<String>>();
	static ArrayList<ArrayList<String>> labelOrder=new ArrayList<ArrayList<String>>();
	static ArrayList<ArrayList<String>> staticStrings = new ArrayList<ArrayList<String>>();
	static ArrayList<String> errorReport = new ArrayList<String>();
	static String inputFile;
	public static void main(String[] args){
		inputFile=JOptionPane.showInputDialog("Enter task filename:");
		//Read the file
		try{
		    BufferedReader reader = new BufferedReader(new FileReader(inputFile));
		    
		    String line;
		    while ((line = reader.readLine()) != null){
		    	if(line.isEmpty()||line.indexOf(':')==-1){
		    		errorReport.add("Line:"+line+"\nError: Line is empty or there is no \':\' delimiter for filename\n\n");
		    		continue;
		    	}
		    	String[] temp = line.split("<");
		    	for(int i=1;i<temp.length;i++){
		    		//System.out.println(temp[i]);
		    		if(temp[i].indexOf('>')==-1){//There is no end! Skip!
		    			System.out.println("Added EOL error");
		    			errorReport.add("Line:"+line+"\nOffending segment:"+temp[i]+"\nError: Expected end of label, got EOL\n\n");
		    			continue;
		    		}
		    		String[] contents = temp[i].substring(0,temp[i].indexOf('>')).split("/");
		    		for(int j=0;j<contents.length;j++)
		    			labels.put(contents[j],new ArrayList<String>());
		    	}
		    }
		    
			reader.close();
		}catch(Exception e){
			e.printStackTrace();
			JOptionPane.showMessageDialog(null, "Error scanning task file for labels\n"+e.getMessage());
			return;
		}
			
		try {
			readLabelFiles();
		} catch (Exception e) {
			e.printStackTrace();
			JOptionPane.showMessageDialog(null, "Error reading label files\n"+e.getMessage());
			return;
		}
		try {
			fillStringOrderArrays();
		} catch (Exception e) {
			e.printStackTrace();
			JOptionPane.showMessageDialog(null, "Error parsing task file\n"+e.getMessage());
			return;
		}
		try{
			labelIterate();
		}catch(Exception e){
			e.printStackTrace();
			JOptionPane.showMessageDialog(null, "Error generating tasks\n"+e.getMessage());
			return;
		}
		try{
			writeErrorReport();
		}catch(Exception e){
			e.printStackTrace();
			JOptionPane.showMessageDialog(null, "Error printing error report\n"+e.getMessage());
			return;
		}
	}
	
	private static void labelIterate() throws IOException{
		File theDir = new File("output");
		// if the directory does not exist, create it
		if (!theDir.exists()) {
		    try{
		        theDir.mkdir();
		    } 
		    catch(SecurityException se){
		        //handle it
		    }        
		}
		for(int i=0;i<labelOrder.size();i++){//Every task
			BufferedWriter bw = new BufferedWriter(new FileWriter("./output/"+staticStrings.get(i).get(0).split(":")[0]+".out"));
			System.out.print("Iterating through task "+staticStrings.get(i).get(0).split(":")[0]+"...");
			//ArrayList<String> results=new ArrayList<String>();
			ArrayList<String> task=labelOrder.get(i);
			int[] count=new int[task.size()];
			//fill the count with zeros
			for(int j=0;j<task.size();j++){
				count[j]=0;
			}
			
			//Get how many iterations there must be
			long iterations=1;
			for(int j=0;j<task.size();j++){
				int sizeCount=0;
				//System.out.println(task.get(j));
				String[] contents=task.get(j).split("/");
				for(int k=0;k<contents.length;k++){
					if(labels.get(contents[k]).isEmpty())
						errorReport.add("Label error detected in task "+staticStrings.get(i).get(0).split(":")[0]+"("+contents[k]+"). Either label file was empty or non-existent, skipping...\n\n");
					sizeCount+=labels.get(contents[k]).size();
				}
				iterations*=sizeCount;
			}
			System.out.print("("+iterations+" iterations)");
			int test=0;
			if(iterations>10000000)
				test=JOptionPane.showConfirmDialog(null, "Warning: Task "+staticStrings.get(i).get(0).split(":")[0]+" has over ten million iterations("+iterations+"), this may take a while to process. Do want to continue?\n(task will be skipped if you choose \"no\")");
			if(test!=0){
				System.out.println("Skipping...");
				continue;
			}
			for(long j=0;j<iterations;j++){
				
				//Put it in an array
				String result="";
		    	result+=staticStrings.get(i).get(0);
		    	for(int k=0;k<task.size();k++){
		    		
		    		int tempIndex=count[k];
		    		String[] contents=task.get(k).split("/");
		    		
		    		//Reduce the count[k] value
		    		int l;
		    		for(l=0;l<contents.length;l++)
		    			if(labels.get(contents[l])!=null){
			    			if(tempIndex>=labels.get(contents[l]).size())
			    				tempIndex-=labels.get(contents[l]).size();
			    			else
			    				break;
		    			}else{
		    				continue;
		    			}
		    				
		    		
		    		if(labels.get(contents[l])!=null)
		    			result+=""+labels.get(contents[l]).get(tempIndex)+staticStrings.get(i).get(k+1);
		    		else
		    			result+=""+staticStrings.get(i).get(k+1);
		    		//System.out.println(result);
		    	}
		    	bw.write(result+"\n");
				//System.out.println(result);
				
				if(task.size()==0){
					errorReport.add("Line:"+result+"\nError: No labels were detected in the line, mistake?\n\n");
					continue;
				}
				count[task.size()-1]++;
				//Increment the counter array
				for(int k=task.size()-1;k>=0;k--){
					int tempMax=0;
					String[] contents=task.get(k).split("/");
					for(int l=0;l<contents.length;l++)
						tempMax+=labels.get(contents[l]).size();
					if(count[k]>=tempMax&&k!=0){
						count[k-1]++;
						count[k]=0;
					}
				}
				//System.out.print(""+staticStrings.get(i).get(0).split(":")[0]+":("+j+"/"+iterations+")%\r");
			}
			System.out.println("Done");
			
			bw.flush();
			bw.close();
			/*
			try {
				write(results);
			} catch (Exception e) {
				e.printStackTrace();
				JOptionPane.showMessageDialog(null, "Error writing results to file\n"+e.getMessage());
				return;
			}*/
			//results.clear();
		}
	}
	
	private static void fillStringOrderArrays() throws IOException{
		BufferedReader reader = new BufferedReader(new FileReader(inputFile));
	    
	    String line;
	    int l=0;
	    while ((line = reader.readLine()) != null)
	    {
	    	if(line.isEmpty()||line.indexOf(':')==-1)
	    		continue;
	    	staticStrings.add(new ArrayList<String>());
	    	labelOrder.add(new ArrayList<String>());
	    	String[] temp = line.split("<");
	    	staticStrings.get(l).add(temp[0]);
	    	for(int i=1;i<temp.length;i++){
	    		String[] temp2=temp[i].split(">");
	    		labelOrder.get(l).add(temp2[0]);
	    		if(temp2.length>1)
	    			staticStrings.get(l).add(temp2[1]);
	    		else
	    			staticStrings.get(l).add("");
	    	}
	    	l++;
	    }
	    reader.close();

	    for(int i=0;i<labelOrder.size();i++){
	    	//System.out.print(""+i+":"+staticStrings.get(i).get(0));
	    	for(int j=0;j<labelOrder.get(i).size();j++){
	    		//System.out.print(""+labelOrder.get(i).get(j)+staticStrings.get(i).get(j+1));
	    	}
	    	//System.out.println();
	    }
	}
	
	private static void readLabelFiles() throws IOException{
		ArrayList<BufferedReader> readers = new ArrayList<BufferedReader>();
		Enumeration<String> iter=labels.keys();
	    while(iter.hasMoreElements()){
	    	String key=iter.nextElement();
	    	try{
	    	BufferedReader reader = new BufferedReader(new FileReader(key+".txt"));
	    	String line;
		    while ((line = reader.readLine()) != null)
		    {
		    	if(line.equals(""))
		    		continue;
		    	labels.get(key).add(line);
		    }
		    readers.add(reader);
	    	}catch(FileNotFoundException e){
	    		errorReport.add("Error:Unable to find file for "+key+" label.\n\n");
	    		//JOptionPane.showMessageDialog(null,"Unable to find file "+key+".txt\n\n");
	    		continue;
	    	}
	    }
	    for(BufferedReader br:readers){
	    	br.close();
	    }
	    iter=labels.keys();
	    while(iter.hasMoreElements()){
	    	String key=iter.nextElement();
	    	ArrayList<String> temp=labels.get(key);
	    	for(String str:temp){
	    		//System.out.println(key+":"+str);
	    	}
	    }
	    
	}
	private static void writeErrorReport() throws IOException{
		if(errorReport.size()>0){
			BufferedWriter bw = new BufferedWriter(new FileWriter("./output/errorReport.out"));
			for(int j=0;j<errorReport.size();j++)
				bw.write(errorReport.get(j));
			bw.flush();
			bw.close();
			JOptionPane.showMessageDialog(null, "Program completed with errors, please see error report in the output folder.");
		}
		else
			JOptionPane.showMessageDialog(null, "Program execution completed.");
	}
}