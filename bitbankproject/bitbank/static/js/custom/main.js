COUNT_PER_PAGE = 10;

COOKIE_ORDER_MARKET = "ck_order_market"

COOKIE_ORDER_PAIR_BB = "ck_order_pair_bb";
COOKIE_SPECIAL_ORDER_BB = "ck_special_order_bb";

COOKIE_ORDER_PAIR_CC = "ck_order_pair_cc";
COOKIE_SPECIAL_ORDER_CC = "ck_special_order_cc";



COOKIE_ALERT_PAIR = "ck_alert_pair";
COOKIE_ALERT_MARKET = "ck_alert_market";
COOKIE_SEARCH_PAIR_ALERTS = "ck_search_pair_alerts";
COOKIE_SEARCH_PAIR_ACTIVE_ORDERS = "ck_search_pair_ao";
COOKIE_SEARCH_PAIR_ORDER_HISTORY = "ck_search_pair_oh";
COOKIE_LAST_VISITED_TAB = "ck_last_visited_tab";


MARKETS = {
    "bitbank": "bitbank",
    "coincheck": "coincheck"
}

PAIRS = {
    'btc_jpy': 'BTC/JPY',
    'xrp_jpy': 'XRP/JPY',
    'ltc_btc': 'LTC/BTC',
    'eth_btc': 'ETH/BTC',
    'mona_jpy': 'MONA/JPY',
    'mona_btc': 'MONA/BTC',
    'bcc_jpy': 'BCC/JPY',
    'bcc_btc': 'BCC/BTC'
}

STATUS = {
    'UNFILLED': '未約定',
    'PARTIALLY_FILLED': '一部約定済',
    'FULLY_FILLED': '約定済',
    'CANCELED_UNFILLED': 'キャンセル済',
    'CANCELED_PARTIALLY_FILLED': '一部キャンセル済',
    'READY_TO_ORDER': '未注文',
    'FAILED_TO_ORDER': '注文失敗',
    'WAIT_OTHER_ORDER_TO_FILL': '他注文約定待'
}
SPECIAL_ORDERS = {
    'SINGLE': 'SINGLE',
    'IFD': 'IFD',
    'OCO': 'OCO',
    'IFDOCO': 'IFDOCO'  
};

ORDER_SEQ = {
    'order_1': '新規注文',
    'order_2': '決済注文1',
    'order_3': '決済注文2'
}
ORDER_TYPES = {
    'market': '成行',
    'limit': '指値',
    'stop_market': '逆指値',
    'stop_limit': 'ストップリミット',
    'trail': 'トレール'
};

SELL_BUY = {
    'sell': '売',
    'buy' : '買'
}

RATE_UPDATE_FREQ = 11000;

var free_amount_json_last_updated = 0;
var free_amount_json = {
    'bitbank': {},
    'coincheck': {}
};
var market_price_json_last_updated = 0
var market_price_json = {
    'bitbank': {},
    'coincheck': {'btc_jpy':{}}
};

function openTab(evt, tab_id) {

    $('#id_ajax_message').hide();
    $('#id_order_result_message').hide();
    $('#id_contact_message').hide();
    $.cookie(COOKIE_LAST_VISITED_TAB, tab_id, {expire: 7});
    switch( tab_id ) {
        case 'order':
            init_order_tab(false);
            break;
        case 'active_orders':
            init_active_orders_tab(false);
            break;
        case 'order_history':
            init_order_history_tab(false);
            break;
        case 'alerts':
            init_alerts_tab(false);
            break;
        case 'assets':
            init_asset_tab(false);
            break;
        case 'user_info':
            init_user_info_tab(false);
            break;
        case 'contact':
            init_contact_tab(false);
            break;
    }

    // Get all elements with class="tabcontent" and hide them
    $('.tabcontent').each((i, tabcontent) => {
        $(tabcontent).hide();
    });


    // Get all elements with class="tablinks" and remove the class "active"
    $('.tablinks').each((i, tablink) => {
        $(tablink).removeClass('active');
    });

    // Show the current tab, and add an "active" class to the button that opened the tab
    $('#' + tab_id).show();
    evt.target.className += " active";
}



//資産情報取得用

$(function() {

    init_ticker_and_asset_async()
    .then(function() {
        init_order_tab(true);
        init_active_orders_tab(true);
        init_order_history_tab(true);
        init_alerts_tab(true);
        init_asset_tab(true);
        init_user_info_tab(true);
        init_contact_tab(true);
        $('#order_button').click();
    });
    setInterval(async () => {
        await init_ticker_and_asset_async()}, RATE_UPDATE_FREQ
    );

    function convertZenToHan(val){
        var han = val.replace(/[Ａ-Ｚａ-ｚ０-９]/g,function(s){return String.fromCharCode(s.charCodeAt(0)-0xFEE0)});
        return han
        if(val.match(/[Ａ-Ｚａ-ｚ０-９]/g)){
            $(ele).val(han);
        }
    }
    //SET CURSOR POSITION
    $.fn.setCursorPosition = function(pos) {
        this.each(function(index, elem) {
        if (elem.setSelectionRange) {
            elem.setSelectionRange(pos, pos);
        } else if (elem.createTextRange) {
            var range = elem.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
        });
        return this;
    };
    $.fn.getCursorPosition = function () {
        var pos = 0;
        var el = $(this).get(0);
        // IE Support
        if (document.selection) {
            el.focus();
            var Sel = document.selection.createRange();
            var SelLength = document.selection.createRange().text.length;
            Sel.moveStart('character', -el.value.length);
            pos = Sel.text.length - SelLength;
        }
        // Firefox support
        else if (el.selectionStart || el.selectionStart == '0')
            pos = el.selectionStart;
        return pos;
    }

    $('body')
    .on('input', 'input[type2="number"]', function() {
        let value = $(this).val();
        var replaced_value;
        let cursor_pos = $(this).getCursorPosition();

        console.log(cursor_pos);
        if (value.match(/[^０-９^0-9。¥.]/g)) {
            cursor_pos = cursor_pos - 1;
        }
        replaced_value = value
            .replace(/。/g, ".")
            .replace(/[０-９]/g, function(s) {
                return String.fromCharCode(s.charCodeAt(0) - 65248);
            })
            .replace(/[^0-9\.]/g, '');
        
        
        $(this)
        .val(replaced_value)
        .setCursorPosition(cursor_pos);
          
    })
    .on('change','input[type2="number"]' , function() {
        let value = $(this).val();
        if (value != "" && isNaN(value)) {
            set_error_message('数値を入力してください');
            $(this).val('').focus();
        }
    }); 
});

