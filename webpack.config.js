module.exports = {
    entry: {
        main: './main.js'
    },
    module: {
        rules: [
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
        ]
    },
    mode: 'development',
    optimization: {
        minimize: false
    }
}