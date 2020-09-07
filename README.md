## 一个toy React

这里简单利用react的设计原理是实现了一个toy react

首先准备环境：node，npm，webpack，babel
```
npm install webpack webpack-cli babel --save-dev
```

babel需要正常运行还需要相关的包，同时我们需要实现jsx，需要plugin-transform-react-jsx插件解析
```
npm install @babel/babel-core @babel/preset-env @babel/plugin-transform-react-jsx --save-dev
```

为了与react区分开来，我们修改webpack中plugin-transform-react-jsx暴露出来的方法，改为createElement
```
{
    test: /\.js$/,
    use: {
        loader: 'babel-loader',
        options: {
            presets: ['@babel/preset-env'],

            //  重新定义jsx暴露的方法名
            plugins: [['@babel/plugin-transform-react-jsx', {pragma: 'createElement'}]]
        }
    }
}
```

createElement方法会将html组成js代码
```
createElement('tagName', {
    id: 'xxx',
    name: 'xxx',
    key: val,
    ....
}, ...children)
```

要想要实现局部重新渲染，需要用到Dom API里的Range API，每一个最小节点都包装到一个range上，当虚拟dom比较后发生某块区域变化时，重新删插那一块区域的range即可。
```
function replaceContent(range, node) {
    range.insertNode(node);
    range.setStartAfter(node);
    range.deleteContents();

    range.setStartBefore(node);
    range.setEndAfter(node);
}
```
