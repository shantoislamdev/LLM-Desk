export namespace models {
	
	export class Context {
	    maxInput: number;
	    maxOutput?: number;
	
	    static createFrom(source: any = {}) {
	        return new Context(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.maxInput = source["maxInput"];
	        this.maxOutput = source["maxOutput"];
	    }
	}
	export class Credentials {
	    apiKeys: string[];
	
	    static createFrom(source: any = {}) {
	        return new Credentials(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.apiKeys = source["apiKeys"];
	    }
	}
	export class Endpoints {
	    openai: string;
	    anthropic?: string;
	
	    static createFrom(source: any = {}) {
	        return new Endpoints(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.openai = source["openai"];
	        this.anthropic = source["anthropic"];
	    }
	}
	export class FetchedModel {
	    id: string;
	    object?: string;
	    created?: number;
	    owned_by?: string;
	
	    static createFrom(source: any = {}) {
	        return new FetchedModel(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.object = source["object"];
	        this.created = source["created"];
	        this.owned_by = source["owned_by"];
	    }
	}
	export class FetchModelsResult {
	    models: FetchedModel[];
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new FetchModelsResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.models = this.convertValues(source["models"], FetchedModel);
	        this.error = source["error"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class ImportResult {
	    success: boolean;
	    message: string;
	    warnings: string[];
	    // Go type: struct { Providers int "json:\"providers\""; Models int "json:\"models\"" }
	    imported: any;
	
	    static createFrom(source: any = {}) {
	        return new ImportResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.message = source["message"];
	        this.warnings = source["warnings"];
	        this.imported = this.convertValues(source["imported"], Object);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Limit {
	    type: string;
	    limit: number;
	    window: number;
	
	    static createFrom(source: any = {}) {
	        return new Limit(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.limit = source["limit"];
	        this.window = source["window"];
	    }
	}
	export class ModelFeatures {
	    toolCalling?: boolean;
	    reasoning?: boolean;
	    search?: boolean;
	    codeExecution?: boolean;
	    vision?: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ModelFeatures(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.toolCalling = source["toolCalling"];
	        this.reasoning = source["reasoning"];
	        this.search = source["search"];
	        this.codeExecution = source["codeExecution"];
	        this.vision = source["vision"];
	    }
	}
	export class Pricing {
	    input: number;
	    output: number;
	    cached?: number;
	    currency: string;
	
	    static createFrom(source: any = {}) {
	        return new Pricing(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.input = source["input"];
	        this.output = source["output"];
	        this.cached = source["cached"];
	        this.currency = source["currency"];
	    }
	}
	export class Model {
	    id: string;
	    name: string;
	    enabled: boolean;
	    parameters?: string;
	    pricing: Pricing;
	    context: Context;
	    modalities: string[];
	    features?: ModelFeatures;
	    limits?: Limit[];
	
	    static createFrom(source: any = {}) {
	        return new Model(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.enabled = source["enabled"];
	        this.parameters = source["parameters"];
	        this.pricing = this.convertValues(source["pricing"], Pricing);
	        this.context = this.convertValues(source["context"], Context);
	        this.modalities = source["modalities"];
	        this.features = this.convertValues(source["features"], ModelFeatures);
	        this.limits = this.convertValues(source["limits"], Limit);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	export class ProviderFeatures {
	    streaming?: boolean;
	    toolCalling?: boolean;
	    jsonMode?: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ProviderFeatures(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.streaming = source["streaming"];
	        this.toolCalling = source["toolCalling"];
	        this.jsonMode = source["jsonMode"];
	    }
	}
	export class Provider {
	    id: string;
	    name: string;
	    enabled: boolean;
	    credentials: Credentials;
	    endpoints: Endpoints;
	    limits: Limit[];
	    features: ProviderFeatures;
	    models: Model[];
	    isCustom?: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Provider(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.enabled = source["enabled"];
	        this.credentials = this.convertValues(source["credentials"], Credentials);
	        this.endpoints = this.convertValues(source["endpoints"], Endpoints);
	        this.limits = this.convertValues(source["limits"], Limit);
	        this.features = this.convertValues(source["features"], ProviderFeatures);
	        this.models = this.convertValues(source["models"], Model);
	        this.isCustom = source["isCustom"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

