import {TemplateEngine, StandardDialect, AttributeProcessor} from 'thymeleaf';

class LinkWithVariablesProcessor extends AttributeProcessor{
    process(element, attribute, attributeValue, context) {
        let val = attributeValue;
        if(val.includes("${")){
            val = attributeValue.slice(2, -1);
            val = val.replace(/\$\{(.+?)\}/mgi, (mtch, key) => {
                if(!(key in context))
                    throw new Error('Context key "'+ key +'" is not found!');
                return "'"+ context[key] +"'";
            })
            val = '@{'+ eval(val) +'}';
        }

        debugger;
        let value = context.expressionProcessor.process(val, context);
        element.setAttribute(this.name, value ? value.toString() : '');
        return super.process(element, attribute, val, context);
    }
}
class InlineProcessor extends AttributeProcessor{
    constructor(prefix, isomorphic) {
        super(prefix, "inline", isomorphic);
    }

    process(element, attribute, attributeValue, context) {
        element.innerHTML = element.innerHTML.replace(/\[\[\$\{(.+?)\}\]\]/gm, (mtch, key) => {
            if(!(key in context))
                throw new Error('Context key "'+ key +'" is not found!');
            let json = JSON.stringify(context[key]);
            return `"${json.replace(/"/gm, '\\\"')}"`
        })
        return super.process(element, attribute, attributeValue, context);
    }
}

class ExtendedDialect extends StandardDialect{
    get processors() {
        let srcLinkProcessorWithVariables = new LinkWithVariablesProcessor(this.prefix, "src", this.isomorphic);
        let hrefLinkProcessorWithVariables = new LinkWithVariablesProcessor(this.prefix, "href", this.isomorphic);
        return [
            new InlineProcessor(this.prefix, this.isomorphic),
            srcLinkProcessorWithVariables,
            hrefLinkProcessorWithVariables,
            ...super.processors
        ];
    }
}

export default class Thymeleaf extends TemplateEngine{
    /**
     * @param namespace Thymeleaf xmlns namespace
     * @param options
     * @see TemplateEngine
     */
    constructor(namespace = "th", options = {}) {
        options.dialects = options.dialects || [];
        options.dialects.push(new ExtendedDialect(namespace))
        super(options);
    }
}