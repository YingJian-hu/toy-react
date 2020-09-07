const RENDER_TO_DOM = Symbol('render to dom');

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
        this._vdom = this.vdom;
        this._vdom[RENDER_TO_DOM](range);
    }
    
    update() {
        //  vdom比较
        let isSameNode = (oldNode, newNode) => {
            //  type(如果type不一致的话，我们就认为它是完全类型不相同的子节点，直接重构)，props，children
            //  #text content
            if(oldNode.type !== newNode.type)
                return false;

            //  比较属性
            for (const name in newNode.props) {
                if(newNode.props[name] !== oldNode.props[name]) {
                    return false;
                }
            }

            //  旧的属性比新的属性多，则也认为不同
            if(Object.keys(oldNode.props).length > Object.keys(newNode.props).length) 
                return false;

            //  比较文本节点
            if(newNode.type === '#text') {
                if(newNode.content !== oldNode.content) 
                    return false;
            }

            return true;
        }
        let update = (oldNode, newNode) => {
            if(!isSameNode(oldNode, newNode)) {
                newNode[RENDER_TO_DOM](oldNode._range);
                return;
            }

            newNode._range = oldNode._range;

            let newChildren = newNode.vchildren;
            let oldChildren = oldNode.vchildren;

            if(!newChildren || !newChildren.length) {
                return;
            }

            let tailRange = oldChildren[oldChildren.length - 1]._range;

            for(let i = 0; i < newChildren.length; i++) {
                let newChild = newChildren[i];
                let oldChild = oldChildren[i];
                if(i < oldChildren.length) {
                    update(oldChild, newChild);
                }else {
                    let range = document.createRange();
                    range.setStart(tailRange.endContainer, tailRange.endOffset);
                    range.setEnd(tailRange.endContainer, tailRange.endOffset);
                    newChild[RENDER_TO_DOM](range);

                    tailRange = range;
                }
            }
        }

        let vdom = this.vdom;
        update(this._vdom, vdom);

        //  跟新完后，将旧的vdom刷新
        this._vdom = vdom;
    }

    //  setState实现，通过深拷贝对比oldSate与newState
    setState(newState) {
        if(this.state === null || typeof this.state !== 'object') {
            this.state = newState;
            return;
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
        this.update();
    }

    get vdom() {
        return this.render().vdom;
    }
}

class ElementWrapper extends Component {
    constructor(type) {
        super(type)
        this.type = type;
    }
    
    get vdom() {
        this.vchildren = this.children.map(child => child.vdom);
        return this;
    }

    [RENDER_TO_DOM](range) {
        this._range = range;

        let root = document.createElement(this.type);

        //  将setAttribute与appendChild拿到RENDER_TO_DOM中
        for (const name in this.props) {
            let value = this.props[name]
            if(name.match(/^on([\s\S]+)$/)) {
                root.addEventListener(RegExp.$1.replace(/^[\s\S]/, n => n.toLocaleLowerCase()), value);
            } else {
                if(name === 'className') {
                    root.setAttribute('class', value);
                } else {
                    root.setAttribute(name, value);
                }
            }
        }

        if(!this.vchildren)
            this.vchildren = this.children.map(child => child.vdom);

        for (const child of this.vchildren) {
            const childRange = document.createRange();
            childRange.setStart(root, root.childNodes.length);
            childRange.setEnd(root, root.childNodes.length);
            child[RENDER_TO_DOM](childRange);
        }
        
        replaceContent(range, root);
    }
}

class TextWrapper extends Component {
    constructor(content) {
        super(content);
        this.type = '#text';
        this.content = content;
    }
    get vdom() {
        return this;
    }
    [RENDER_TO_DOM](range) {
        this._range = range;

        let root = document.createTextNode(this.content);
        replaceContent(range, root);
    }
}

function replaceContent(range, node) {
    range.insertNode(node);
    range.setStartAfter(node);
    range.deleteContents();

    range.setStartBefore(node);
    range.setEndAfter(node);
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