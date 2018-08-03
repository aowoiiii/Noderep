const express = require('express');
const cheerio = require('cheerio');
const http = require('http');
const iconv = require('iconv-lite');
const router = express.Router();
const async = require('async');


const date = new Date();
var dateYMD = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate()+"  "+date.getHours()+":"+date.getMinutes(); //时间
const page = 177
var index = 1;
var url = 'http://www.ygdy8.net/html/gndy/dyzz/list_23_';
var titles = [];
var btLink = []
var n = 0;


/************************************/
function getTitle(url, i) {
    console.log("正在获取第" + i + "页的内容");
    http.get(url + i + '.html', function (sres) {

        var chunks = [];
        sres.on('data', function (chunk) {
            chunks.push(chunk)
        })

        sres.on('end', function () {
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
                    getTitle(url, ++index)
                } else {
                    console.log("Title获取完毕！");
                    getBtLink()
                }

            } catch (e) {
                console.error("错误信息" + e.message);
            }
        });

    }).on('error', (e) => {
        console.error(`错误: ${e.message}`);
        setTimeout(() => {
            getTitle(url, index)
        }, 20000)
    });
}

function getBtLink() {
    console.log('正在获取' + titles[n].url + '资源链接' + n)
    http.get('http://www.ygdy8.net' + titles[n].url, function (sres) {

        var chunks = [];
        sres.on('data', function (chunk) {
            chunks.push(chunk);
        })

        sres.on('end', function () {
            let sresCode = []
            let tempftp, tempbt;
            try {
                var html = iconv.decode(Buffer.concat(chunks), 'gb2312');
                var $ = cheerio.load(html, {decodeEntities: false});
                $('#Zoom a').each(function (idx, element) {
                    let href = $(element).attr('href')
                    if (href) {
                        if (href.includes('ftp')) { //FTP链接
                            tempftp = href;
                        } else if (href.includes('magnet')) { //磁力链接
                            tempbt = href;
                        }
                    }
                })

                if (tempftp == undefined || tempftp == null) {         //FTP链接格式的强制抓取
                    $('#Zoom').each(function (idx, element) {
                        let format = ['.mkv', '.mp4', '.rmvb']
                        let start, end, indexFormat
                        start = $(element).toString().indexOf('ftp')
                        format.map(x => {
                            if ($(element).toString().includes(x)) {
                                end = $(element).toString().indexOf(x)
                                indexFormat = x
                            }
                        })
                        if (indexFormat != undefined) tempftp = $(element).toString().slice(start, end + indexFormat.length)
                    })
                }

                btLink.push({
                    title: titles[n].title,
                    ftp: tempftp,
                    bt: tempbt
                })
                if (n < titles.length - 1) {
                    n++;
                    if (n % 20 == 0) {
                        setTimeout(() => {
                            getBtLink()
                        }, 1000);
                    } else {
                        getBtLink()
                    }
                } else {
                    console.log("btlink获取完毕！");
                    console.log("获取共" + btLink.length + "部");
                }
            } catch (e) {
                console.error("错误信息" + e.message);
            }
        })
    }).on('error', (e) => {
        console.error(`错误: ${e.message}`);
        setTimeout(() => {
            getBtLink()
        }, 20000)
    });
}

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {btLink: btLink, titles: titles, dateTime: dateYMD});
});

module.exports = router;

function main() {
    console.log("开始爬取");
    getTitle(url, index);
}

main();