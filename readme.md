#iframe跨域通信（自用）#

```
 * iframeConnect 用于跨域iframe通信
 * Copyright (c) 2014, Zythum | zythum02@gmail.com
 *
 * how it work:
 * iframeConnectWith(parent).on('alert', function (msg) { alert(msg) })
 * iframeConnectWith(iframeTag).on('alert', function (msg) { alert(msg) })
 * iframeConnectWith(iframeTag).off('alert', function (msg) { alert(msg) })
 * iframeConnectWith(iframeTag).trigger('alert', '123' })
 * 
 * 注: 父页面中的 iframeConnectWith(iframeTag) 与子页面中的 iframeConnectWith(parent) 通信
```

weibo目前使用的iframe通信的升级版本。内外页只需要部署同一个js文件即可。兼容到ie6
alpha版本。没有实际生产使用过，使用前需测试。