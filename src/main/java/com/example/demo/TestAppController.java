package com.example.demo;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class TestAppController {
	@RequestMapping(path="/")
	public String home(ModelMap model){
		return "demo";
	}
	@RequestMapping(value="/streetData")
	@ResponseBody
	public String search(Model model,String name){
		SearchStreet tool=new SearchStreet();
		if(tool.streetNameFound(name)) {
			return tool.readOSM(name);
		}else {
			return "";
		}
	}
	@RequestMapping(value="/testData")
	@ResponseBody
	public String test(Model model,String name){
		System.out.println(name);
		return "testtesttest";
	}
}
