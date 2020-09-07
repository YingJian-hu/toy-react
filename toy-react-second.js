const RENDER_TO_DOM = Symbol('render to dom');

class ElementWrapper {
    constructor(type) {
        this.root = document.createElement(type);
    }
    setAttribute(name, value) {
        //  绑定事件
        if(name.match(/^on([\s\S]+)$/)) {
            this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, n => n.toLocaleLowerCase()), value);
        } else {
            if(name === 'className') {
                this.root.setAttribute('class', value);
            } else {
                this.root.setAttribute(name, value);
            }
        }
    }
    appendChild(component) {
        const range = document.createRange();
        range.setStart(this.root, this.root.childNodes.length);
        range.setEnd(this.root, this.root.childNodes.length);
        range.deleteContents();
        component[RENDER_TO_DOM](range);
    }
    [RENDER_TO_DOM](range) {
        range.deleteContents();
        range.insertNode(this.root);
    }
}

class TextWrapper {
    constructor(content) {
        this.root = document.createTextNode(content);
    }
    [RENDER_TO_DOM](range) {
        range.deleteContents();
        range.insertNode(this.root);
    }
}

//  为了不用在类组件中去复写setAttribute，appendChild方法，给类组件写一个基础类继承
//  类组件的基础类，实现render方法，props，children等
export class Component {
    constructor() {
        this.props = Object.create(null);
        this.children = [];
        this._range = null;
    }
    setAttribute(name, value) {
        this.props[name] = value;
    }
    appendChild(component) {
        this.children.push(component);
    }

    //  用range API实现渲染，以便于后面实现刷新，之前用root的方式无法实现再次渲染
    //  遇到Class组件递归调用，直到遇到Wrapper再将wrapper插入到range中
    [RENDER_TO_DOM](range) {
        //  用变量保存range，用于再次渲染
        this._range = range;
        this.render()[RENDER_TO_DOM](range);
    }

    //  重新刷新实现
    rerender() {
        //  处理因为老range被deleteContents，块消失的情况，当为空时给插入一个range
        const oldRange = this._range;

        const range = document.createRange();
        range.setStart(oldRange.startContainer, oldRange.startOffset);
        range.setEnd(oldRange.startContainer, oldRange.startOffset);
        this[RENDER_TO_DOM](range);

        oldRange.setStart(range.endContainer, range.endOffset);
        oldRange.deleteContents();
    }

    //  setState实现，通过深拷贝对比oldSate与newState
    setState(newState) {
        if(this.state === null || typeof this.state !== 'object') {
            this.state = newState;
            return this.rerender();
        }

        let merge = (oldState, newState) => {
            for (const p in newState) {
                if(oldState[p] === null || typeof oldState[p] !== 'object') {
                    oldState[p] = newState[p];
                } else {
                    merge(oldState[p], newState[p]);
                }
            }
        }

        merge(this.state, newState);
        this.rerender();
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
            if(typeof child === 'string' || typeof child === 'number') {
                child = new TextWrapper(child);
            }

            if(child === null) {
                continue;
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
    const range = document.createRange();
    range.setStart(root, 0);
    range.setEnd(root, root.childNodes.length);
    range.deleteContents();

    //  将最外层的range插入到root中
    component[RENDER_TO_DOM](range)
}