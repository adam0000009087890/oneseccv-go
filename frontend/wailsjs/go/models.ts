export namespace main {
	
	export class AppStatus {
	    apiReady: boolean;
	    latexReady: boolean;
	    apiKeyMask: string;
	
	    static createFrom(source: any = {}) {
	        return new AppStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.apiReady = source["apiReady"];
	        this.latexReady = source["latexReady"];
	        this.apiKeyMask = source["apiKeyMask"];
	    }
	}
	export class GenerateRequest {
	    userData: string;
	    instruction: string;
	    goalJob: string;
	    templateName: string;
	    withPhoto: boolean;
	    photoPath: string;
	
	    static createFrom(source: any = {}) {
	        return new GenerateRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.userData = source["userData"];
	        this.instruction = source["instruction"];
	        this.goalJob = source["goalJob"];
	        this.templateName = source["templateName"];
	        this.withPhoto = source["withPhoto"];
	        this.photoPath = source["photoPath"];
	    }
	}
	export class GenerateResult {
	    success: boolean;
	    message: string;
	    outputDir: string;
	
	    static createFrom(source: any = {}) {
	        return new GenerateResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.message = source["message"];
	        this.outputDir = source["outputDir"];
	    }
	}
	export class Template {
	    file: string;
	    label: string;
	    preview: string;
	
	    static createFrom(source: any = {}) {
	        return new Template(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.file = source["file"];
	        this.label = source["label"];
	        this.preview = source["preview"];
	    }
	}

}

