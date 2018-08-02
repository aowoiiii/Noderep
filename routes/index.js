const express = require('express');
const cheerio = require('cheerio');
const http = require('http');
const iconv = require('iconv-lite');
const router = express.Router();
const async=require('async');

const page = 163
var index = 1;
var url = 'http://www.ygdy8.net/html/gndy/dyzz/list_23_';
var titles = [];
var btLink = []
var n = 0;


/************************************/
function getTitle(url, i) {
    console.log("正在获取第" + i + "页的内容");
    http.get(url + i + '.html', function(sres) {

        const { statusCode } = sres;
        let error;
        if (statusCode !== 200) {
            error = new Error('请求失败。\n' +
                `状态码: ${statusCode}`);
        }
        if (error) {
            console.error(error.message);
            // 消耗响应数据以释放内存
            sres.resume();
            return;
        }

        var chunks = [];
        sres.on('data', function(chunk) {
            chunks.push(chunk)
        })

        sres.on('end', function() {
            try {
                var html = iconv.decode(Buffer.concat(chunks), 'gb2312');
                var $ = cheerio.load(html, {decodeEntities: false});
                $('.co_content8 .ulink').each(function (idx, element) {
                    var $element = $(element);
                    titles.push({
                        title: $element.text(),
                        url: $element.attr('href')
                    })
                })
                if (i < page) {
                    // if (i % 20 == 0) {
                    //     setTimeout(() => {
                    //         getTitle(url, ++index)
                    //     }, 1000);
                    // } else {
                        getTitle(url, ++index)
                    // }
                } else {
                    console.log("Title获取完毕！");
                    getBtLink()
                }

            }catch (e) {
                console.error("错误信息"+e.message);
            }
        });

    }).on('error', (e) => {
        console.error(`错误: ${e.message}`);
        setTimeout(()=>{getTitle(url, index)},10000)
    });
}

function getBtLink() {
    console.log('正在获取'+titles[n].url+'资源链接'+n)
    http.get('http://www.ygdy8.net' + titles[n].url, function(sres) {
        const { statusCode } = sres;
        let error;
        if (statusCode !== 200) {
            error = new Error('请求失败。\n' +
                `状态码: ${statusCode}`);
        }
        if (error) {
            console.error(error.message);
            // 消耗响应数据以释放内存
            sres.resume();
            return;
        }

        var chunks = [];
        sres.on('data', function(chunk) {
            chunks.push(chunk);
        })

        sres.on('end', function() {
            let tempftp ,tempbt;
            try {
                var html = iconv.decode(Buffer.concat(chunks), 'gb2312');
                var $ = cheerio.load(html, {decodeEntities: false});
                $('#Zoom td').children('a').each(function (idx, element) { //FTP链接
                    var $element = $(element);
                        tempftp = $element.attr('href');
              })
                $('#Zoom p').children('a').each(function (idx, element) { //FTP链接
                    var $element = $(element);
                    tempbt = $element.attr('href');
                })

                {
                    btLink.push({
                        title: titles[n].title,
                        ftp: tempftp,
                        bt: tempbt
                    })

                }
            if(n < titles.length - 1) {
                n++;
                // if(n % 20 ==0){
                //     setTimeout(()=>{getBtLink()},1000);
                // } else {
                    getBtLink()
                // }
            } else {
                console.log("btlink获取完毕！");
                console.log("获取共"+btLink.length+"部");
            }
        }catch(e) {
                console.error("错误信息"+e.message);
            }})
    }).on('error', (e) => {
        console.error(`错误: ${e.message}`);
        setTimeout(()=>{getBtLink()},10000)
    });
}

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { btLink: btLink, titles: titles });
});

module.exports = router;

function main() {
    console.log("开始爬取");
    getTitle(url, index);
}

main();