package com.example.demo;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.ximpleware.*;

public class SearchStreet{
	String path;
	public SearchStreet() {
//		testPath();
		jarPath();
	}
	public void testPath() {
		path="D:/";
	}
	public void jarPath() {
		path = this.getClass().getProtectionDomain().getCodeSource().getLocation().getPath();
		int firstIndex= path.indexOf(":")+1;
		int index=path.lastIndexOf("mapc.jar");
		path = path.substring(firstIndex, index);
	}
	public boolean streetNameFound(String streetName) {
		try {
			VTDGen vg = new VTDGen();
			if (vg.parseFile(path + "map.osm", true)) {
				VTDNav vn = vg.getNav();
				AutoPilot ap = new AutoPilot(vn);
				ap.selectXPath("/osm/way/tag[@v=\"" + streetName + "\"]");
				String nodeRef = "";
				while (ap.evalXPath() != -1) {
					VTDNav nav = ap.getNav().cloneNav();
					int current = nav.getCurrentIndex();
					String kVal = nav.toString(nav.getAttrVal("k"));
					if (kVal.equalsIgnoreCase("name")) {
						nav.toElement(VTDNav.PARENT);
						nav.toElement(VTDNav.FIRST_CHILD);
						current = nav.getCurrentIndex();
						do {
							int index = nav.getAttrVal("ref");
							if (index != -1) {
								nodeRef += nav.toString(index);
								nodeRef += ",";
							}
						} while (nav.toString(current).equalsIgnoreCase("nd")
								&& nav.toElement(VTDNav.NEXT_SIBLING));
					}
				}// while
				return nodeRef.length() > 0;
			}
		} catch (Exception e) {
			System.out.println(e.getMessage());
			return false;
		}
		return false;
	}

	public String readOSM(String streetName) {
		JsonArray array=new JsonArray();
		try {
			VTDGen vg = new VTDGen();
			if (vg.parseFile(path + "map.osm", true)) {
				VTDNav vn = vg.getNav();
				AutoPilot ap = new AutoPilot(vn);
				ap.selectXPath("/osm/way/tag[@v=\"" + streetName + "\"]");
				String nodeRef = "";
				while (ap.evalXPath() != -1) {
					VTDNav nav = ap.getNav().cloneNav();
					int current = nav.getCurrentIndex();
					String kVal = nav.toString(nav.getAttrVal("k"));
					if (kVal.equalsIgnoreCase("name")) {
						nav.toElement(VTDNav.PARENT);
						nav.toElement(VTDNav.FIRST_CHILD);
						current = nav.getCurrentIndex();
						do {
							int index = nav.getAttrVal("ref");
							if (index != -1) {
								nodeRef += nav.toString(index);
								nodeRef += ",";
							}
						} while (nav.toString(current).equalsIgnoreCase("nd")
								&& nav.toElement(VTDNav.NEXT_SIBLING));
					}
				}// while
				if (nodeRef.length() > 0) {
					String[] refs = nodeRef.split(",");
					for (int i = 0; i < refs.length; i++) {
						ap.resetXPath();
						ap.selectXPath("/osm/node[@id=\"" + refs[i] + "\"]");
						if (ap.evalXPath() != -1) {
							int latIndex = ap.getNav().getAttrVal("lat");
							int lngIndex = ap.getNav().getAttrVal("lon");
							String latStr = ap.getNav().toString(latIndex);
							String lngStr = ap.getNav().toString(lngIndex);
							 double lat=Double.parseDouble(latStr);
							 double lng=Double.parseDouble(lngStr);
							 JsonObject tmp=new JsonObject();
							 tmp.addProperty("lat", lat);
							 tmp.addProperty("lng", lng);
							 array.add(tmp);
						}
					}
				} else {
					System.out.println("Not Found");
				}
			}
		} catch (Exception e) {
			System.out.println(e.getMessage());
		}
		return array.toString();
	}
}
