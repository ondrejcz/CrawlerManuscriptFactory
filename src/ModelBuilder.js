import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';
import dom from './dom';

const INTERACTIVE_ELEMENTS = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];

export default class ModelBuilder {
  deDupeName(name) {
    if (this.model.usedNames.hasOwnProperty(name)) {
      name = `${name}${++this.model.usedNames[name]}`;
    } else {
      this.model.usedNames[name] = 1;
    }
    return name;
  }

  cleanName(name) {
    return this.deDupeName(upperFirst(camelCase(name)));
  }

  generateName(element) {
    const id = dom.getId(element);
    const name = dom.getName(element);
    const textContent = dom.getTextContent(element);
    const tagName = dom.getTagName(element);
    const tagIndex = dom.getTagIndex(element);

    if (/^(?:^INPUT$|^BUTTON$|^SELECT$|^TEXTAREA$|^PROGRESS$|^METER$)$/im.test(tagName)) {
      const labelName = dom.getLabel(element).textContent.trim();

      if (labelName) {
        return this.cleanName(labelName);
      }

      if (tagName === 'BUTTON' || /^(?:^SUBMIT$|^RESET$)$/im.test(element.type)) {
        const val = element.value.trim();
        if (val) {
          return this.cleanName(val);
        }
      }
    }

    if (name) {
      return this.cleanName(name);
    }
    if (id) {
      return this.cleanName(id);
    }

    if (tagName === 'A' && element.href && element.href.startsWith('mailto:')) {
      return this.cleanName(element.href.replace('mailto:', '').split('@')[0] + 'EmailLink');
    }

    if (textContent) {
      return this.cleanName(textContent);
    }

    return this.cleanName(`${tagName}${tagIndex}`);
  }

  static createEmptyModel() {
    return {
      usedNames: {},
      entities: [],
    };
  }
  createModel(element, existingModel = null) {
    console.log('createModel');

    this.model = existingModel || ModelBuilder.createEmptyModel();

    if (existingModel) {
      this.model.entities.push(this.createEntity(element));
      return this.model;
    }

    const walker = element.ownerDocument.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: function(node) {
          if (dom.isVisible(node)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT; //node and children
        },
      },
      true
    );
    while (walker.nextNode()) {
      const childElement = walker.currentNode;
      if (INTERACTIVE_ELEMENTS.includes(childElement.tagName)) {
        this.model.entities.push(this.createEntity(childElement));
      }
    }
    return this.model;
  }

  createEntity(element) {
    const tagName = dom.getTagName(element);
    const tagIndex = dom.getTagIndex(element);

    return {
      name: this.generateName(element),
      locators: {
        id: dom.getId(element),
        name: dom.getName(element),
        linkText: dom.getLinkText(element),
        className: dom.getClassName(element),
        tagName: tagName,
        tagIndex: tagIndex,
        css: dom.getCssSelector(element),
        xpath: dom.getXPath(element),
      },
    };
  }
}
