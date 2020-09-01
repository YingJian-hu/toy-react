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