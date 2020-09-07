class ElementWrapper {
    constructor(type) {
        this.root = document.createElement(type);
    }
    setAttribute(name, value) {
        this.root.setAttribute(name, value);
    }
    appendChild(component) {
        this.root.appendChild(component.root);
    }
}

class TextWrapper {
    constructor(content) {
        this.root = document.createTextNode(content);
    }
}

//  为了不用在类组件中去复写setAttribute，appendChild方法，给类组件写一个基础类继承
//  类组件的基础类，实现render方法，props，children等
export class Component {
    constructor() {
        this.props = Object.create(null);
        this.children = [];
        this._root = null;
    }
    setAttribute(name, value) {
        this.props[name] = value;
    }
    appendChild(component) {
        this.children.push(component);
    }
    get root() {
        if(!this._root) {
            this._root = this.render().root;
        }
        return this._root;
    }
}

//  函数名与jsx解析后的函数名所对应，用于解析jsx语法
export function createElement(type, attributes, ...children) {
    let e;
    if(typeof type === 'string') {
        //  因可能设计到类组件，因此需要设计一个Wrapper
        e =  new ElementWrapper(type);
    } else {
        e = new type;
    } 
    for (const p in attributes) {
        e.setAttribute(p, attributes[p]);
    }

    let insertChildren = (children) => {
        for (const child of children) {
            if(typeof child === 'string') {
                child = new TextWrapper(child);
            }

            //  因类组件嵌套的html直接已数组方式插入到了this.children中，需要展开
            if(typeof child === 'object' && child instanceof Array) {
                insertChildren(child);
            }else {
                e.appendChild(child);
            }
        }
    }

    insertChildren(children);
    
    return e;
}

export function render(component, root) {
    root.appendChild(component.root);
}