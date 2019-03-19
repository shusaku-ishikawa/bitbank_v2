var free_amount_json = {};
var market_price_json = {};

function call_assets(method, is_async = true) {
    return $.ajax({
        url: '{% url "bitbank:ajax_assets" %}',
        type: (method == 'GET') ? 'GET':'POST',
        dataType: 'json',
        async: is_async,
        data: {
            method: method,
        }
    });
}
function call_ticker(method, pair, is_async = true) {
    return $.ajax({
        url: '{% url "bitbank:ajax_ticker" %}',
        type: (method == 'GET') ? 'GET':'POST',
        dataType: 'json',
        
        async: is_async,
        data: {
            method: method,
            'pair': pair
        },
    });
}

function call_user(method, full_name, api_key, api_secret_key, email_for_notice, notify_if_filled, use_alert) {
    return $.ajax({
        url: '{% url "bitbank:ajax_user" %}',
        type: (method == 'GET') ? 'GET':'POST' ,
        
        dataType: 'json',
        data: {
            method: method,
            full_name: full_name,
            api_key: api_key,
            api_secret_key: api_secret_key,
            email_for_notice: email_for_notice,
            notify_if_filled: notify_if_filled,
            use_alert: use_alert
        }
    });
}

function call_orders(method, pair, offset = null, limit = null, type = null, pk = null, special_order = null, order_1, order_2, order_3) {
    return $.ajax({
        url: '{% url "bitbank:ajax_orders" %}',
        type: (method == 'GET') ? 'GET' : 'POST',
        dataType: 'json',
        data: {
            method: method,
            offset: offset,
            limit: limit,
            type: type,
            pk: pk,
            pair: pair,
            special_order: special_order,
            order_1: order_1,
            order_2: order_2,
            order_3: order_3
        }
    });
}

function call_alerts(method, pk, pair, offset, limit, threshold, over_or_under) {
    return $.ajax({
        url: '{% url "bitbank:ajax_alerts" %}',
        type: (method == 'GET') ? 'GET' : 'POST',
        dataType: 'json',
        data: {
            method:method,
            pk: pk,
            pair: pair,
            offset: offset,
            limit: limit,
            threshold: threshold,
            over_or_under: over_or_under
        }
    });
}


function call_attachment(method, pk) {
    return $.ajax({
        url: '{% url "bitbank:ajax_attachment" %}',
        type: 'POST',
        dataType: 'json',
        data : {
            method: method,
            pk: pk
        },
    });
}
function call_inquiry(method, subject, body, email, attachment_pk_list) {
    return $.ajax({
        url: '{% url "bitbank:ajax_inquiry" %}',
        type: 'POST',
        dataType: 'json',
        data: {
            subject: subject,
            body: body,
            email_for_reply: email,
            att_pk_1: (attachment_pk_list.length > 0) ? attachment_pk_list[0] : null,
            att_pk_2: (attachment_pk_list.length > 1) ? attachment_pk_list[1] : null,
            att_pk_3: (attachment_pk_list.length > 2) ? attachment_pk_list[2] : null,
        },
    });
}



function hyphen_if_null(subj) {
    if (subj == null || subj == undefined || subj == '0') {
        return '-';
    } else {
        return subj;
    }
}

function isNumberKey(evt){
    var charCode = (evt.which) ? evt.which : event.keyCode;
    return !(charCode > 31 && (charCode < 48 || charCode > 57));
}

function initialize_free_amount_json() {
    call_assets('GET')
    .done(function(res) {
        if (res.error) {
            set_error_message($('#id_ajax_message'), res.error);
            return;
        }
        res.assets.forEach(asset => {
            free_amount_json[asset.asset] = asset.free_amount;
        });
    })
    .fail(function(data, textStatus, xhr) {
        if (data.status == 401) {
            window.location.href = "{% url 'bitbank:login' %}";
        }
        set_error_message($('#id_ajax_message'), xhr);
    });
}

function initialize_ticker_json() {
    Object.keys(PAIRS).forEach(pair => {
        call_ticker('GET', pair)
        .done(function (res) {
            if (res.error) {
                set_error_message($('#id_ajax_message'),200 , res.error);
                return;
            }
            //console.log(res);
            market_price_json[pair] = res;              
        })
        .fail(function(data, textStatus, xhr) {
            if (data.status == 401) {
                window.location.href = "{% url 'bitbank:login' %}";
            }
            set_error_message($('#id_ajax_message'), xhr);
        });
    });
}

function return_formatted_datetime(unixtime, date_only=false) {
    if (unixtime == 0) {
        return '-';
    }
    var date = new Date(unixtime);
    var year = date.getFullYear();
    var month = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1):date.getMonth() + 1 ;
    var day = date.getDate() < 10 ? '0' + date.getDate():date.getDate();
    var hours = date.getHours() < 10 ? '0' + date.getHours():date.getHours();
    var minutes = date.getMinutes() < 10 ? '0' + date.getMinutes():date.getMinutes();
    var seconds = date.getSeconds() < 10 ? '0' + date.getSeconds():date.getSeconds();
    if (date_only) {
        return(year + "/" + month + "/" + day);
    }
    return(year + "/" + month + "/" + day + " " + hours + ":" + minutes + ":" + seconds);
}


function display_price_div(tab_num, order_type) {
    switch (order_type) {
        case 'market':
            $('.show_if_stop_order_' + tab_num).hide();
            $('.show_if_limit_order_' + tab_num).hide();
            $('.show_if_trail_' + tab_num).hide();
            
            break;
        case 'limit':
            $('.show_if_stop_order_' + tab_num).hide();
            $('.show_if_limit_order_' + tab_num).show();
            $('.show_if_trail_' + tab_num).hide();
            break;
        case 'stop_market':
            $('.show_if_stop_order_' + tab_num).show();
            $('.show_if_limit_order_' + tab_num).hide();
            $('.show_if_trail_' + tab_num).hide();
            break;
        case 'stop_limit':
            $('.show_if_stop_order_' + tab_num).show();
            $('.show_if_limit_order_' + tab_num).show();
            $('.show_if_trail_' + tab_num).hide();
            break;
        case 'trail':
            $('.show_if_stop_order_' + tab_num).hide();
            $('.show_if_limit_order_' + tab_num).hide();
            $('.show_if_trail_' + tab_num).show();
            break;
    }
}

function update_amount_by_slider(tab_num) {
    var newVal = $('#myRange_' + tab_num).val();
    $('#amount_percentage_' + tab_num).html(newVal + '%');
    if($('#id_pair').val() == '') {
        return;
    }
    
    var pair = $('#id_pair').val();
    var side = $('#id_side_' + tab_num).val();
    var order_type = $('#id_order_type_' + tab_num).val();
    var currency = (side == 'sell') ? pair.split('_')[0] : pair.split('_')[1];
    if (parseInt(newVal) != 0) {
        var free_amount = free_amount_json[currency];
        var price = (order_type.match(/market/)) ? parseFloat(market_price_json[pair][side]) : ($('#id_price_' + tab_num).val() != '') ? parseFloat($('#id_price_' + tab_num).val()) : 0;
        var floored = (side == 'sell') ? Math.floor((free_amount * newVal / 100) * 10000) / 10000 : (price != 0) ? Math.floor((free_amount * newVal / (price * 100)) * 10000) / 10000 : 0;
        $('#id_start_amount_' + tab_num).val(floored).trigger('calculate');
    } else {
        $('#id_start_amount_' + tab_num).val(0).trigger('calculate');
    }
    
}

function update_slider_by_amount(tab_num) {
    var pair = $('#id_pair').val();
    var side = $('#id_side_' + tab_num).val(); 

    if (side == 'buy') {
        var currency = pair.split('_')[1];
    } else {
        var currency = pair.split('_')[0];
    }
    
    
    var order_type = $('#id_order_type_' + tab_num).val();
    
    var new_amount = $('#id_start_amount_' + tab_num).val();

    // limit orderの場合
    if (order_type.match(/limit/)) {
        var new_price = $('#id_price_' + tab_num).val();
    } else {
        var new_price = market_price_json[pair][side];
    }

    if (new_amount == '' || new_amount == 0 || new_price == '' || new_price == 0) {
        set_slidevalue(tab_num, 0, false);
    } else {
        if (side == 'buy') {
            var perc = new_price * new_amount * 100 / parseFloat(free_amount_json[currency]);
        } else {
            var perc = new_amount * 100 / parseFloat(free_amount_json[currency]);   
        }
        
        if (perc > 100.0) {
            $('#amount_percentage_' + tab_num).html('資金不足');
        } else {
            var rounded = Math.round(perc * 10) / 10;
            set_slidevalue(tab_num, rounded, false);
            if (currency == 'jpy') {
                $('#expect_price_' + tab_num).val(Math.round(new_price * new_amount));
            } else {
                $('#expect_price_' + tab_num).val(Math.round(new_price * new_amount * 10000) / 10000);
            } 
        }
    }
}





function calculate_expect_price(tab_num) {
    var pair = $('#id_pair').val();
    var side = $('#id_side_' + tab_num).val();
    var order_type = $('#id_order_type_' + tab_num).val();
    var amount = $('#id_start_amount_' + tab_num).val();

    if (parseFloat(amount) == 0 || amount == '') {
        $('#expect_price_' + tab_num).val(0);
    } else {
        var price = (order_type.match(/market/)) ? parseFloat(market_price_json[pair][side]) : ($('#id_price_' + tab_num).val() != '') ? parseFloat($('#id_price_' + tab_num).val()) : 0;
        if (pair.split('_')[1] == 'jpy') {
            $('#expect_price_' + tab_num).val(Math.floor(price * amount));    
        } else {
            $('#expect_price_' + tab_num).val(price * amount);    
        }
    }
}
function create_order_json(pair, side, order_type, price, price_for_stop, start_amount) {
    var order_info = new Object();
    order_info.pair = pair;
    order_info.side = side;
    order_info.order_type = order_type;
    order_info.price = price;
    order_info.price_for_stop = price_for_stop;
    order_info.start_amount = start_amount;
    return JSON.stringify(order_info);
}
function _order(pair, special_order, order_1, order_2, order_3,  message_target) {
    call_orders('POST', pair, null, null, null, null, special_order, order_1, order_2, order_3)
    .done(function(res) {
        if (res.error) {
            set_error_message(message_target, res.error);
            return;
        }
        set_success_message(message_target, '注文が完了しました');
    })
    .fail(function(data, textStatus, xhr) {
        if (data.status == 401) {
            window.location.href = "{% url 'bitbank:login' %}";
        }
        set_error_message(message_target, xhr);
    });
}
function get_confirmation(order_name) {
    $.confirm({
        title: '<span style="color:black>確認</span>',
        content: '<span style="color:black">' + order_name + 'は確定後すぐに約定しますがこの価格でよろしいですか？</span>',
        type: 'red',
        buttons: {
            confirm: {
                text: 'はい',
                btnClass: 'green_button',
                
                action: function () {
                    return true;
                }
            },
            cancel:{
                text: 'いいえ',
                btnClass: 'red_button',
                action: function () {
                    return false;
                },
            }
        }
    });
}
function place_order(pair, special_order, order_1, order_2, order_3,  message_target) {
    // if (order_1 != null) {
    //     if (order_1.order_type.match(/limit/)) {
    call_ticker('GET', pair)
    .done(function(res) {
        if (res.error) {
            set_error_message(message_target, res.error);
            return;
        }
            
        if (order_1 != null && order_1.order_type == 'limit') {
            if ((order_1.side == 'buy' && parseFloat(res.buy) < order_1.price) || (order_1.side  == 'sell' && parseFloat(res.sell) > order_1.price)){
                if (!get_confirmation('新規注文')) {
                    return;
                }
            }
        }
        if (order_1 == null && order_2.order_type == 'limit') {
            if ((order_2.side == 'buy' && parseFloat(res.buy) < order_2.price) || (order_2.side  == 'sell' && parseFloat(res.sell) > order_2.price)){
                if (!get_confirmation('決済注文1')) {
                    return;
                }
            }
        } 
        if (order_1 == null && order_3.order_type == 'limit') {
            if ((order_3.side == 'buy' && parseFloat(res.buy) < order_3.price) || (order_3.side  == 'sell' && parseFloat(res.sell) > order_3.price)){
                if (!get_confirmation('決済注文2')) {
                    return;
                }
            }
        } 
        _order(pair, special_order, order_1, order_2, order_3,  message_target);
    })
    .fail(function(data, textStatus, xhr) {
    
        if (data.status == 401) {
            window.location.href = "{% url 'bitbank:login' %}";
        }
        set_error_message(message_target, xhr);
    });            
}
function set_slidevalue(tab_num, new_val, trigger_input_event=true) {
    var tar = $('#myRange_' + tab_num);
    if (trigger_input_event) {
        tar.val(new_val).trigger('input');
    } else {
        tar.val(new_val);
    }
    
    var ini = (tar.val() - tar.attr('min')) / (tar.attr('max') - tar.attr('min'));
    tar.css('background-image',
            '-webkit-gradient(linear, left top, right top, '
            + 'color-stop(' + ini + ', ' + ($('#id_side_' + tab_num).val() == 'buy' ? 'teal' : 'orangered') + '), '
            + 'color-stop(' + ini + ', #333333)'
            + ')'
    );
    $('#amount_percentage_' + tab_num).html(new_val + '%');
}

function set_default_price(tab_num, pair, message_target) {
    call_ticker('GET', pair)
    .done(function(res) {
        if (res.error) {
            set_error_message(message_target, res.error);
            return;
        }
        var new_order_type = $('#id_order_type_' + tab_num).val();
        if (new_order_type != 'market') {
            $('#id_price_' + tab_num).val(res.last);
            $('#id_price_for_stop_' + tab_num).val(res.last);
        }
    })
    .fail(function(data, textStatus, xhr) {
        if (data.status == 401) {
            window.location.href = "{% url 'bitbank:login' %}";
        }
        //alert('call ticker erorr');
        set_error_message(message_target, xhr);
    });
}
function reset_input(i) {
    $('#id_price_' + i).val(null);
    $('#id_price_for_stop_' + i).val(null);
    $('#id_start_amount_' + i).val(null);
    $('#expect_price_' + i).val(null);
    set_slidevalue(i, 0, false);
}
function reset_input_all() {
    var $input = $('input[type="number"]');
    var $message_target = $('#id_ajax_message_target');
    var $pair = $('#id_pair');

    $input.val(null);
    for (let i = 0; i < 4; i ++) {
        set_slidevalue(i, 0, false);
        $('#id_side_' + i).val(Object.keys(SELL_BUY)[1]).trigger('value_change');
        $('#id_order_type_' + i).val(Object.keys(ORDER_TYPES)[1]).trigger('change');
        set_default_price(i, $pair.val(), $message_target);
    }
}

function initialize_order_tab(is_initial = false) {
    var $order_result_message_target = $('#id_order_result_message');
    var $ajax_message_target = $('#id_ajax_message');
    initialize_ticker_json();
    initialize_free_amount_json();

    for (let i = 1; i < 4; i ++) {
        if ($('#id_side_' + i).val() == 'sell') {
            $('#sell_button_' + i).addClass('sell').removeClass('btn-base');
            $('#buy_button_' + i).removeClass('buy').addClass('btn-base');
        } else {
            $('#buy_button_' + i).addClass('buy').removeClass('btn-base');
            $('#sell_button_' + i).removeClass('sell').addClass('btn-base');
        }
    }
    

    //画面ロード時のみ
    if (is_initial) {
        var $input_pair = $('#id_pair');
        var $input_special_order = $('#id_special_order');
        var $button_order = $('#id_order_button');
        var $input_number = $('input[type="number"]');
        var $slick = $('#slider_contents');
        
        // bitbank/coincheck start
        var $bitbank_button = $('#id_bitbank');
        var $coincheck_button = $('#id_coincheck');
        var $input_market = $('#id_market');
        // bitbank/coincheck end
      
        var side_option_html = '';
        var order_type_option_html = '';
        
        $slick
        .slick({
            swipe: false,
            touchMove: false,
            prevArrow: false,
            nextArrow: false,
            dots: true,
            appendDots: $('#id_dots_area')
        });
        
        Object.keys(MARKETS).forEach(key => {
            $('<option>', {
                value: key,
                text: MARKETS[key],
            }).appendTo($input_market);
        });

        Object.keys(PAIRS).forEach(key => {
            $('<option>', {
                value: key,
                text: PAIRS[key],
            }).appendTo($input_pair);
        });

        Object.keys(SPECIAL_ORDERS).forEach(key => {
            $('<option>', {
                value: key,
                text: SPECIAL_ORDERS[key],
            }).appendTo($input_special_order);
        });
 
        $input_market
        .on('value_change', function() {
            reset_input_all(); 
            if ($(this).val() == 'bitbank') {
                $bitbank_button.addClass('active');
                $coincheck_button.removeClass('active');
            } else {
                $bitbank_button.removeClass('active');
                $coincheck_button.addClass('active');
            }
        });
        $bitbank_button
        .on('click', function() {
            // 変更があった場合のみ処理
            if ($input_market.val() == 'coincheck') {
                $input_market.val('bitbank').trigger('value_change');
            } else {
                // do nothing  
            }
        });
        $coincheck_button
        .on('click', function() {
            // 変更があった場合のみ処理
            if ($input_market.val() == 'bitbank') {
                $input_market.val('coincheck').trigger('value_change');
            } else {
                // do nothing
            }
        });
        $input_special_order
        .on('change', function() {
            $.cookie(COOKIE_SPECIAL_ORDER, $(this).val(), { expires: 7 });
            reset_input_all();    
            
            
            $slick
            .slick('slickUnfilter')
            .slick('slickFilter', function(index){
                switch ($('#id_special_order').val()) {
                    case 'SINGLE':
                        if (index == 0){
                            return $(this).eq(index);  
                        }
                        break;
                    case 'IFD':
                        if (index < 2){
                            return $(this).eq(index);  // スライド番号が2より小さいものだけ表示
                        }
                        break;
                    case 'OCO':
                        if (index > 0){
                            return $(this).eq(index);  // スライド番号が2より小さいものだけ表示
                        }
                        break;
                    case 'IFDOCO':
                        return $(this).eq(index);  // スライド番号が2より小さいものだけ表示
                        break;
                }   
            });

            $slick.slick('slickGoTo', 0);
            
        });

        $input_pair.on('change', function() {
            $.cookie(COOKIE_ORDER_PAIR, $(this).val(), { expires: 7 });

            reset_input_all();    
            

            // 数量、金額の通貨部分を更新
            var unit = $(this).val().split('_')[0].toUpperCase();
            var currency = $(this).val().split('_')[1].toUpperCase();
            if (currency != '') {
                $('div.pair').html(currency);
                $('div.unit').html(unit);
            }
            
            $slick.slick('slickGoTo', 0);
        });
        
        // クッキーにあればデフォルトセット
        var ck_pair = $.cookie(COOKIE_ORDER_PAIR);
        if (ck_pair != undefined && Object.keys(PAIRS).indexOf(ck_pair) >= 0) {
            $input_pair.val(ck_pair).trigger('change');
        } else {
            // 無ければ先頭の選択肢をセット
            $input_pair.val(Object.keys(PAIRS)[0]);
        }
            
        for (let i = 1; i < 4; i++) {
            
            $('#myRange_' + i).on("input", function () {
                update_amount_by_slider(i);
                var val = ($(this).val() - $(this).attr('min')) / ($(this).attr('max') - $(this).attr('min'));
                //alert($('#id_side_' + i).val() == 'buy' ? 'teal' : 'orangered');
                $(this).css('background-image',
                    '-webkit-gradient(linear, left top, right top, '
                    + 'color-stop(' + val + ', ' + ($('#id_side_' + i).val() == 'buy' ? 'teal' : 'orangered') + '),'
                    + 'color-stop(' + val + ', #333333)'
                    + ')'
                );
            });

            $('#id_start_amount_' + i)
            .on('change', function() {
                update_slider_by_amount(i);
            })
            .on('calculate', function() {
                calculate_expect_price(i);
            });

            $('#id_start_amount_' + i)
            .on('change', function() {
                update_slider_by_amount(i);
            });

            $('#id_order_type_' + i)
            .on('change', function() {
                reset_input(i);
                var new_order_type = $(this).val();
                if (new_order_type == 'limit') {
                    $('#id_price_placeholder_' + i).html('指値価格');
                } else if (new_order_type == 'stop_market') {
                    $('#id_stop_price_placeholder_' + i).html('逆指値価格');
                } else if (new_order_type == 'stop_limit') {
                    $('#id_stop_price_placeholder_' + i).html('逆指値(発動価格)');
                    $('#id_price_placeholder_' + i).html('指値(約定希望価格)');
                }
                if (new_order_type != 'market') {
                    set_default_price(i, $input_pair.val(), $ajax_message_target);
                }
                
                display_price_div(i, new_order_type);
            });

            $('#id_side_' + i)
            .on('value_change', function() {
                reset_input(i);
                if ($(this).val() == 'buy') {
                    
                    $('#sell_button_' + i).removeClass('sell').addClass('btn-base');
                    $('#buy_button_' + i).addClass('buy').removeClass('btn-base');
                    $('#myRange_' + i).addClass('slider_for_buy').removeClass('slider_for_sell');
                    $button_order.addClass('green_button').removeClass('red_button');
                } else {
                    
                    $('#sell_button_' + i).addClass('sell').removeClass('btn-base');
                    $('#buy_button_' + i).removeClass('buy').addClass('btn-base');
                    $('#myRange_' + i).addClass('slider_for_sell').removeClass('slider_for_buy');
                    $button_order.removeClass('green_button').addClass('red_button');
                }
                set_default_price(i, $input_pair.val(), $ajax_message_target);
            });
            $('#sell_button_' + i).on('click', function() {
                // 変更があった場合のみ処理
                if ($('#id_side_' + i).val() == 'buy') {
                    $('#id_side_' + i).val('sell').trigger('value_change');
                    $button_order.removeClass('green_button').addClass('red_button'); 
                } else {
                    // do nothin  
                }
            });
            $('#buy_button_' + i).on('click', function() {
                // 変更があった場合のみ処理
                if ($('#id_side_' + i).val() == 'sell') {
                    $('#id_side_' + i).val('buy').trigger('value_change');
                    $button_order.removeClass('red_button').addClass('green_button');
                } else {
                   // do nothing
                }
            });

            Object.keys(SELL_BUY).forEach(key => {
                $('<option>', {
                    value: key,
                    text: SELL_BUY[key],
                }).appendTo($('#id_side_' + i));
            });
    
            Object.keys(ORDER_TYPES).forEach(key => {
                $('<option>', {
                    value: key,
                    text: ORDER_TYPES[key],
                }).appendTo($('#id_order_type_' + i));
            });

            $('#id_side_' + i).val(Object.keys(SELL_BUY)[1]).trigger('value_change');
            $('#id_order_type_' + i).val(Object.keys(ORDER_TYPES)[1]).trigger('change');
            set_slidevalue(i, 0);
            display_price_div(i, $('#id_order_type_' + i).val());
        }
        
        var ck_special_order = $.cookie(COOKIE_SPECIAL_ORDER);
        if (ck_special_order != undefined && Object.keys(SPECIAL_ORDERS).indexOf(ck_special_order) >= 0) {
            $input_special_order.val(ck_special_order).trigger('change');
        } else {
            $input_special_order.val(SPECIAL_ORDERS[Object.keys(SPECIAL_ORDERS)]).trigger('change');
        }

        $button_order.on('click', function(e) {
            var pair = $input_pair.val();
            var special_order = $input_special_order.val();
            
            var side_1 = $('#id_side_1').val();
            var side_2 = $('#id_side_2').val();
            var side_3 = $('#id_side_3').val();
            
            var order_type_1 = $('#id_order_type_1').val();
            var order_type_2 = $('#id_order_type_2').val();
            var order_type_3 = $('#id_order_type_3').val();
            
            var price_1 = $('#id_price_1').val() == '' ? null : parseFloat($('#id_price_1').val());
            var price_2 = $('#id_price_2').val() == '' ? null : parseFloat($('#id_price_2').val());
            var price_3 = $('#id_price_3').val() == '' ? null : parseFloat($('#id_price_3').val());
            
            var price_for_stop_1 = $('#id_price_for_stop_1').val() == '' ? null : parseFloat($('#id_price_for_stop_1').val());
            var price_for_stop_2 = $('#id_price_for_stop_2').val() == '' ? null : parseFloat($('#id_price_for_stop_2').val());
            var price_for_stop_3 = $('#id_price_for_stop_3').val() == '' ? null : parseFloat($('#id_price_for_stop_3').val());

            var start_amount_1 = $('#id_start_amount_1').val();
            var start_amount_2 = $('#id_start_amount_2').val();
            var start_amount_3 = $('#id_start_amount_3').val();
            
            var order_1 = create_order_json(pair, side_1, order_type_1, price_1, price_for_stop_1, start_amount_1);
            var order_2 = create_order_json(pair, side_2, order_type_2, price_2, price_for_stop_2, start_amount_2);
            var order_3 = create_order_json(pair, side_3, order_type_3, price_3, price_for_stop_3, start_amount_3);
        
            switch ($input_special_order.val()) {
                case 'SINGLE':
                    place_order(pair, special_order, order_1, null, null, order_result_message_target);
                    break;
                case 'IFD':
                    place_order(pair, special_order, order_1, order_2, null, order_result_message_target);
                    break;
                case 'OCO':
                    place_order(pair, special_order, null, order_2, order_3, order_result_message_target);
                    break;
                case 'IFDOCO':
                    place_order(pair, special_order, order_1, order_2, order_3, order_result_message_target);
                    break;
            }
        });  
    }
}
function build_order_card_header(pair, special_order) {
    var table_html = '';
    table_html += '<div class="order_header">';
    table_html += '<div class="row">';
    table_html += '<div class="col-3 card-table-header">取引通貨</div>';
    table_html += '<div class="col-3 card-table-data">' + pair + '</div>';
    table_html += '<div class="col-3 card-table-header">特殊注文</div>';
    table_html += '<div class="col-3 card-table-data">' + special_order + '</div>';
    table_html += '</div>';
    table_html += '</div>';
    return table_html;
}
function build_active_order_card(is_cancellable, order_seq, pk, order_id, order_type, side, price, price_for_stop, start_amount, executed_amount,average_price, status, ordered_at) {
    var table_html = '';
    table_html += '<div class="order_body">';
    table_html += '<div class="row">';
    table_html += '<div class="col-3 card-table-header">注文ID</div>';
    table_html += '<div class="col-3 card-table-data">' + order_id + '</div>';
    table_html += '<div class="col-3 card-table-header">売/買</div>';
    table_html += '<div class="col-3 card-table-data">' + side + '</div>';
    table_html += '</div>';
    table_html += '<div class="row">';
    table_html += '<div class="col-3 card-table-header">タイプ</div>';
    table_html += '<div class="col-3 card-table-data">' + order_type + '</div>';
    table_html += '<div class="col-3 card-table-header">逆指値価格</div>';
    table_html += '<div class="col-3 card-table-data">' + price_for_stop + '</div>';
    table_html += '</div>';
    table_html += '<div class="row">';
    table_html += '<div class="col-3 card-table-header">数量</div>';
    table_html += '<div class="col-3 card-table-data">' + start_amount + '</div>';
    table_html += '<div class="col-3 card-table-header">指値価格</div>';
    table_html += '<div class="col-3 card-table-data">' + price + '</div>';
    table_html += '</div>';
    table_html += '<div class="row">';
    table_html += '<div class="col-3 card-table-header">約定数量</div>';
    table_html += '<div class="col-3 card-table-data">' + executed_amount + '</div>';
    table_html += '<div class="col-3 card-table-header">平均価格</div>';
    table_html += '<div class="col-3 card-table-data">' + average_price + '</div>';
    table_html += '</div>';
    table_html += '<div class="row">';
    table_html += '<div class="col-6 card-table-header">注文日時</div>';
    table_html += '<div class="col-6 card-table-data">' + ordered_at + '</div>';
    table_html += '</div>';
    table_html += '<div class="row">';
    table_html += '<div class="col-6 card-table-header">ステータス</div>';
    table_html += '<div class="col-6 card-table-data">' + status + '</div>';
    table_html += '</div>';
    table_html += '<div class="row justify-content-end">';
    switch (order_seq) {
        case 'order_1':
            table_html += '<span class="badge badge-info">新規注文</span>'
            break;
        case 'order_2':
            table_html += '<span class="badge badge-success">決済注文❶</span>'
            break;
        case 'order_3':
            table_html += '<span class="badge badge-primary">決済注文❷</span>'
            break;
    }
    table_html += '</div>';
    
    table_html += '<hr><div class="row">';
    if (is_cancellable) {
        table_html += '<button style="font-size:1rem; padding:0.2em!important" pk="' + pk + '" type="button" class="btn btn-outline-secondary" name="cancel_order_button">CANCEL</button>';
    } else {
        table_html += '<p style="color:red;font-weight:bold">新規注文をCANCELする場合は、<br>先に決済注文を全てCANCELさせてください</p>'
    }
    table_html += '</div>';
    table_html += '</div>';

    return table_html;
}
function build_history_order_card(pk, order_id, pair, order_type, side, price, price_for_stop, start_amount, executed_amount,average_price, status, ordered_at, error_message, failed_at) {
    var table_html = '';
    table_html += '<div class="order_history_body">';
    table_html += '<div class="row">';
    table_html += '<div class="col-3 card-table-header">注文ID</div>';
    table_html += '<div class="col-3 card-table-data">' + order_id + '</div>';
    table_html += '<div class="col-3 card-table-header">取引通貨</div>';
    table_html += '<div class="col-3 card-table-data">' + pair + '</div>';
    table_html += '</div>';
    table_html += '<div class="row">';
    table_html += '<div class="col-3 card-table-header">タイプ</div>';
    table_html += '<div class="col-3 card-table-data">' + order_type + '</div>';
    table_html += '<div class="col-3 card-table-header">売/買</div>';
    table_html += '<div class="col-3 card-table-data">' + side + '</div>';
    table_html += '</div>';
    table_html += '<div class="row">';
    table_html += '<div class="col-3 card-table-header">数量</div>';
    table_html += '<div class="col-3 card-table-data">' + start_amount + '</div>';
    table_html += '<div class="col-3 card-table-header">指値価格</div>';
    table_html += '<div class="col-3 card-table-data">' + price + '</div>';
    table_html += '</div>';
    table_html += '<div class="row">';
    table_html += '<div class="col-3 card-table-header">約定数量</div>';
    table_html += '<div class="col-3 card-table-data">' + executed_amount + '</div>';
    table_html += '<div class="col-3 card-table-header">平均価格</div>';
    table_html += '<div class="col-3 card-table-data">' + average_price + '</div>';
    table_html += '</div>';
    table_html += '<div class="row">';
    table_html += '<div class="col-6 card-table-header">注文日時</div>';
    table_html += '<div class="col-6 card-table-data">' + ordered_at + '</div>';
    table_html += '</div>';
    table_html += '<div class="row">';
    table_html += '<div class="col-6 card-table-header">ステータス</div>';
    table_html += '<div class="col-6 card-table-data">' + status + '</div>';
    table_html += '</div>';
    if (error_message != null && error_message != "") {
        table_html += '<div class="row">';
        table_html += '<div class="col-12 card-table-data alert-danger">' + error_message + '</div>';
        table_html += '</div>';
        table_html += '<div class="row">';
        table_html += '<div class="col-4 card-table-header">エラー時刻</div>';
        table_html += '<div class="col-8 card-table-data">' + failed_at + '</div>';
        table_html += '</div>';
    }
    table_html += '</div>';
    return table_html;
}


function initialize_active_orders_content(message_target) {
    var page_selection = $('#page_selection_active_orders');
    var search_pair = $('#id_active_orders_search_pair').val();
    call_orders('GET', search_pair, 0, 1, 'active')
    .done(function(res_1) {
        if (res_1.error) {
            set_error_message(message_target, res_1.error);
            return;
        }
        if(page_selection.data("twbs-pagination")){
            page_selection.empty();
            page_selection.removeData("twbs-pagination");
            page_selection.unbind("page");
        }
        page_selection.twbsPagination({
            totalPages: (res_1.total_count == 0) ? 1 : Math.ceil(res_1.total_count / COUNT_PER_PAGE),
            next: '次',
            prev: '前',
            first: '先頭',
            last: '最後',
            onPageClick: function (event, page) {
                var table_html = '';
                call_orders('GET', search_pair, COUNT_PER_PAGE * (page - 1), COUNT_PER_PAGE, 'active')
                .done(function(res_2) {
                    if (res_2.error) {
                        set_error_message(message_target, res_2.error);
                        return;
                    }
                    console.log(res_2);
                    var html_header = '<div class="row"><div class="col-md-6 offset-md-3 col-12">';
                    var html_footer = '</div></div><hr>';

                    var wrapper = '<div class="order_container">';
                    var content_html = '';
                    console.log(res_2.data);
                    var is_empty = true;
                    res_2.data.forEach(active_order => {
                        is_empty = false;
                        content_html += wrapper;
                        content_html += build_order_card_header(PAIRS[active_order.pair], active_order.special_order)
                        if (active_order.order_1) {
                            content_html += build_active_order_card(active_order.special_order == 'SINGLE', 'order_1', active_order.order_1.pk,hyphen_if_null(active_order.order_1.order_id),ORDER_TYPES[active_order.order_1.order_type],SELL_BUY[active_order.order_1.side],hyphen_if_null(active_order.order_1.price),hyphen_if_null(active_order.order_1.price_for_stop),active_order.order_1.start_amount,hyphen_if_null(active_order.order_1.executed_amount),hyphen_if_null(active_order.order_1.average_price),STATUS[active_order.order_1.status],return_formatted_datetime(active_order.order_1.ordered_at));
                        }
                        if (active_order.order_2) {
                            content_html += build_active_order_card(true, 'order_2', active_order.order_2.pk,hyphen_if_null(active_order.order_2.order_id),ORDER_TYPES[active_order.order_2.order_type],SELL_BUY[active_order.order_2.side],hyphen_if_null(active_order.order_2.price),hyphen_if_null(active_order.order_2.price_for_stop),active_order.order_2.start_amount,hyphen_if_null(active_order.order_2.executed_amount),hyphen_if_null(active_order.order_2.average_price),STATUS[active_order.order_2.status],return_formatted_datetime(active_order.order_2.ordered_at));
                        }
                        if (active_order.order_3) {
                            content_html += build_active_order_card(true, 'order_3', active_order.order_3.pk,hyphen_if_null(active_order.order_3.order_id),ORDER_TYPES[active_order.order_3.order_type],SELL_BUY[active_order.order_3.side],hyphen_if_null(active_order.order_3.price),hyphen_if_null(active_order.order_3.price_for_stop),active_order.order_3.start_amount,hyphen_if_null(active_order.order_3.executed_amount),hyphen_if_null(active_order.order_3.average_price),STATUS[active_order.order_3.status],return_formatted_datetime(active_order.order_3.ordered_at));
                        }
                        content_html += '</div><hr>'
                    });
                    if (is_empty) {
                        content_html = '取引はありません';
                    }
                    $('#active_orders_content').html(html_header + content_html + html_footer);


                    //キャンセルボタンクリック時のイベント追加
                    $("button[name='cancel_order_button']").on('click', function() {
                        var pk = $(this).attr('pk');
                        call_orders('DELETE', null, null, null, null, pk)
                        .done(function(res) {
                            if (res.error) {
                                set_error_message('#id_ajax_message', res.error);
                                return;
                            }
                        
                            set_success_message(message_target, '注文をキャンセルしました');
                            $('#active_orders_button').click();
                            message_target.show();
                        })
                        .fail(function(data, textStatus, xhr) {
                            if (data.status == 401) {
                                window.location.href = "{% url 'bitbank:login' %}";
                            }
                            set_error_message(message_target, xhr);
                        });
                        
                    });
                })
                .fail(function(data, textStatus, xhr) {
                    if (data.status == 401) {
                        window.location.href = "{% url 'bitbank:login' %}";
                    }
                    set_error_message(message_target, xhr);
                });
            }
        });
    })
    .fail(function(data, textStatus, xhr) {
        if (data.status == 401) {
            window.location.href = "{% url 'bitbank:login' %}";
        }
        set_error_message(message_target, xhr);
    });
}
function initialize_active_orders_tab(is_initial = false) {
    var message_target = $('#id_ajax_message');
    var search_pair = $('#id_active_orders_search_pair');
    
    if (is_initial) {
        var search_pair_option_html = '';
        search_pair_option_html += '<option value="all">全て</option>'; 
        Object.keys(PAIRS).forEach(pair => {
            search_pair_option_html += '<option value="' + pair + '">' + PAIRS[pair] + '</option>';
        });
        search_pair.html(search_pair_option_html);

        search_pair.on('change', function() {
            $.cookie(COOKIE_SEARCH_PAIR_ACTIVE_ORDERS, $(this).val(), {expire: 7});
            initialize_active_orders_content(message_target);
        });
    }
    var ck_search_pair_ao = $.cookie(COOKIE_SEARCH_PAIR_ACTIVE_ORDERS);
    if (ck_search_pair_ao != undefined) {
        search_pair.val(ck_search_pair_ao).trigger('change');
    } else {
        search_pair.val('all').trigger('change');
    }
}
function initialize_order_history_content(message_target) {
    var page_selection = $('#page_selection_order_history');
    var search_pair = $('#id_order_history_search_pair').val();

    call_orders('GET', search_pair, 0, 1, 'history')
    .done(function(res_1) {
        if (res_1.error) {
            set_error_message(message_target, res_1.error);
            return;
        }
        if(page_selection.data("twbs-pagination")){
            page_selection.empty();
            page_selection.removeData("twbs-pagination");
            page_selection.unbind("page");
        } 
        page_selection.twbsPagination({
            totalPages: (res_1.total_count == 0) ? 1 : Math.ceil(res_1.total_count / COUNT_PER_PAGE),
            next: '次',
            prev: '前',
            first: '先頭',
            last: '最後',
            onPageClick: function (event, page) {
                var html_header = '<div class="row"><div class="col-md-6 offset-md-3 col-12">';
                var html_footer = '</div></div><hr>';
                var wrapper = '<div class="order_container">';
                var wrapper_end = '</div><hr>';
                var content_html = '';
                call_orders('GET', search_pair, COUNT_PER_PAGE * (page - 1), COUNT_PER_PAGE, 'history')
                .done(function(res_2) {
                    if (res_2.error) {
                        set_error_message(message_target, res_2.error);
                        return;
                    }
                    var is_empty = true;
                    res_2.data.forEach(order => {
                        is_empty = false;
                        content_html += wrapper;
                        
                        content_html += build_history_order_card(order.pk,hyphen_if_null(order.order_id), PAIRS[order.pair], ORDER_TYPES[order.order_type],SELL_BUY[order.side],hyphen_if_null(order.price),hyphen_if_null(order.price_for_stop),order.start_amount,hyphen_if_null(order.executed_amount),hyphen_if_null(order.average_price),STATUS[order.status],return_formatted_datetime(order.ordered_at), order.error_message, return_formatted_datetime(order.updated_at * 1000));
                        content_html += wrapper_end;
                        
                    });
                    // 1件もない場合
                    if (is_empty) {
                        content_html = '取引はありません';
                    }
                    $('#order_history_content').html(html_header + content_html + html_footer);
                })
                .fail(function(data, textStatus, xhr) {
                    if (data.status == 401) {
                        window.location.href = "{% url 'bitbank:login' %}";
                    }
                    set_error_message(message_target, xhr);
                });
            }
        });
    })
    .fail(function(data, textStatus, xhr) {
        if (data.status == 401) {
            window.location.href = "{% url 'bitbank:login' %}";
        }
        set_error_message(message_target, xhr);
    });
}
function initialize_order_history_tab(is_initial = false) {
    var message_target = $('#id_ajax_message');
    var search_pair = $('#id_order_history_search_pair');
    
    if (is_initial) {
        var search_pair_option_html = '';
        search_pair_option_html += '<option value="all">全て</option>'; 
        Object.keys(PAIRS).forEach(pair => {
            search_pair_option_html += '<option value="' + pair + '">' + PAIRS[pair] + '</option>';
        });
        search_pair.html(search_pair_option_html);

        search_pair.on('change', function() {
            $.cookie(COOKIE_SEARCH_PAIR_ORDER_HISTORY, $(this).val(), {expire: 7});
            initialize_order_history_content(message_target);
        });
    }
    
    var ck_search_pair_oh = $.cookie(COOKIE_SEARCH_PAIR_ORDER_HISTORY);
    if (ck_search_pair_oh != undefined) {
        search_pair.val(ck_search_pair_oh).trigger('change');
    } else {
        search_pair.val('all').trigger('change');
    }
}

function initialize_alerts_content(message_target) {
    var $notify_if_filled_on_button = $('#notify_if_filled_on_button');
    var $notify_if_filled_off_button = $('#notify_if_filled_off_button');
    var $use_alert_on_button = $('#id_use_alert_on_button');
    var $use_alert_off_button = $('#id_use_alert_off_button');
    var $page_selection = $('#page_selection_alerts');
    var $search_pair = $('#id_alerts_search_pair');

    call_user('GET')
    .done(function(res) {
        if (res.error) {
            set_error_message(message_target, res.error);
            return;
        }
        console.log(res);
        if (res.notify_if_filled == 'ON') {
            $notify_if_filled_on_button.click();
        } else {
            $notify_if_filled_off_button.click();
            
        }
        if (res.use_alert == 'ON') {
            $use_alert_on_button.click();
        } else {
            $use_alert_off_button.click();
        }
    })
    .fail(function(data, textStatus, xhr) {
        if (data.status == 401) {
            window.location.href = "{% url 'bitbank:login' %}";
        }
        set_error_message(message_target, xhr);
    });

    
    call_alerts('GET', null, $search_pair.val(), 0, 1)
    .done(function(res_1) {
        if (res_1.error) {
            set_error_message(message_target, res_1.error);
            return;
        }
        if($page_selection.data("twbs-pagination")){
            $page_selection.empty();
            $page_selection.removeData("twbs-pagination");
            $page_selection.unbind("page");
        }
        $page_selection.twbsPagination({
            totalPages: (res_1.total_count == 0) ? 1 : Math.ceil(res_1.total_count / COUNT_PER_PAGE),
            next: '次',
            prev: '前',
            first: '先頭',
            last: '最後',
            onPageClick: function (event, page) {
                var table_html = '';
                call_alerts('GET', null, $search_pair.val(), COUNT_PER_PAGE * (page - 1), COUNT_PER_PAGE)
                .done(function(res_2) {
                    var table_html = '';
                    $.parseJSON(res_2.active_alerts).forEach(active_alert => {
                        table_html += '<div class="row"><div class="col-md-6 offset-md-3 col-12"><div class="order_container"><div class="order_history_body"><div class="row">';
                        table_html += '<div class="col-6 card-table-header">取引通貨</div>';
                        table_html += '<div class="col-6 card-table-data">' + PAIRS[active_alert.fields.pair] + '</div>';
                        table_html += '</div>';
                        table_html += '<div class="row">';
                        table_html += '<div class="col-6 card-table-header">通知レート</div>';
                        table_html += '<div class="col-6 card-table-data">' + active_alert.fields.threshold + '</div>';
                        table_html += '</div>';
                        table_html += '<div class="row">';
                        table_html += '<button style="font-size:1rem; padding:0.2em!important" pk="' + active_alert.pk + '" type="button" class="btn btn-outline-secondary" name="deactivate_alert_button">CANCEL</button>';
                        table_html += '</div>'
                        table_html += '</div></div></div></div><hr>';
                    });
                    $('#alert_container').html(table_html);
                
                    $("button[name='deactivate_alert_button']").on('click', function() {
                        var pk = $(this).attr('pk');
                        call_alerts('DELETE', pk)
                        .done(function(res_3) {
                            if (res_3.error) {
                                set_error_message(message_target, res_3.error);
                                return;
                            }
                            set_success_message('#id_ajax_message', '通知設定を解除しました');
                            
                            $('#alerts_button').click();
                            message_target.show();
                        })
                        .fail(function(data, textStatus, xhr) {
                            if (data.status == 401) {
                                window.location.href = "{% url 'bitbank:login' %}";
                            }
                            set_error_message(message_target, xhr);
                        });
                    });
                })
                .fail(function(data, textStatus, xhr) {
                    if (data.status == 401) {
                        window.location.href = "{% url 'bitbank:login' %}";
                    }
                    set_error_message(message_target, xhr);
                });
            }
        });

    })
    .fail(function(data, textStatus, xhr) {
        if (data.status == 401) {
            window.location.href = "{% url 'bitbank:login' %}";
        }
        set_error_message(message_target, xhr);
    });
}
function initialize_alerts_tab(is_initial = false) {
    var message_target = $('#id_ajax_message');
    var $pair_for_alert = $('#id_pair_for_alert');
    var $notify_if_filled_on_button = $('#notify_if_filled_on_button');
    var $notify_if_filled_off_button = $('#notify_if_filled_off_button');
    var $use_alert_on_button = $('#id_use_alert_on_button');
    var $use_alert_off_button = $('#id_use_alert_off_button');
    var $add_button = $('#add_alert_button');
    var $search_pair = $('#id_alerts_search_pair');
    var $noticy_rate = $('#id_notice_rate');
    var $pair_for_alert_class = $('.pair_for_alert');

    // 初回時のみの処理
    if (is_initial) {
        var option_html = '';
        Object.keys(PAIRS).forEach(pair => {
            option_html += '<option value="' + pair + '">' + PAIRS[pair] + '</option>';
        });
        
        $pair_for_alert.on('change', function() {
            $.cookie(COOKIE_ALERT_PAIR, $(this).val(), {expire: 7});
            var currency = $(this).val().split('_')[1].toUpperCase();
            call_ticker('GET', $(this).val())
            .done((data) => {
                if (data.error) {
                    set_error_message(message_target, data.error);
                    return;
                }
                $noticy_rate.val(data.last);
            })
            .fail((data, textStatus, xhr) => {
                if (data.status == 401) {
                    window.location.href = "{% url 'bitbank:login' %}";
                }
                set_error_message(message_target, xhr);
            });
            $pair_for_alert_class.html(currency);
        });
        $notify_if_filled_on_button.on('click', function() {
            if ($(this).hasClass('on')) {
                // すでにONの場合は何もしない
            } else {
                call_user('POST', null, null, null, null, 'ON', null)
                .done(function(res) {
                    if (res.error) {
                        set_error_message(message_target, res.error);
                        return;
                    }
                    $notify_if_filled_on_button.addClass('on').removeClass('btn-base');
                    $notify_if_filled_off_button.removeClass('off').addClass('btn-base');
                })
                .fail(function(data, textStatus, xhr) {
                    if (data.status == 401) {
                        window.location.href = "{% url 'bitbank:login' %}";
                    }
                    set_error_message(message_target, xhr);
                });
            }
        });
        $notify_if_filled_off_button.on('click', function() {
            
            if ($(this).hasClass('off')) {
                // すでにOFFの場合は何もしない
               
            } else {
                call_user('POST',null, null, null, null, 'OFF', null)
                .done(function(res) {
                    if (res.error) {
                        set_error_message(message_target, res.error);
                        return;
                    }
                    
                    $notify_if_filled_on_button.removeClass('on').addClass('btn-base');
                    $notify_if_filled_off_button.addClass('off').removeClass('btn-base');
                })
                .fail(function(data, textStatus, xhr) {
                    if (data.status == 401) {
                        window.location.href = "{% url 'bitbank:login' %}";
                    }
                    set_error_message(message_target, xhr);
                });
            }
        });

        $use_alert_on_button.on('click', function() {
            if ($(this).hasClass('on')) {
                // すでにONの場合は何もしない
            } else {
                call_user('POST', null, null, null, null, null, 'ON')
                .done(function(res) {
                    if (res.error) {
                        set_error_message(message_target, res.error);
                        return;
                    }
                    $use_alert_on_button.addClass('on').removeClass('btn-base');
                    $use_alert_off_button.removeClass('off').addClass('btn-base');
                })
                .fail(function(data, textStatus, xhr) {
                    if (data.status == 401) {
                        window.location.href = "{% url 'bitbank:login' %}";
                    }
                    set_error_message(message_target, xhr);
                });
            }
        });
        $use_alert_off_button.on('click', function() {
            if ($(this).hasClass('off')) {
                // すでにOFFの場合は何もしない
            } else {
                call_user('POST',null, null, null, null, null, 'OFF')
                .done(function(res) {
                    if (res.error) {
                        set_error_message(message_target, res.error);
                        return;
                    }
                    $use_alert_on_button.removeClass('on').addClass('btn-base');
                    $use_alert_off_button.addClass('off').removeClass('btn-base');
                })
                .fail(function(data, textStatus, xhr) {
                    if (data.status == 401) {
                        window.location.href = "{% url 'bitbank:login' %}";
                    }
                    set_error_message(message_target, xhr);
                });
            }
        });


        $add_button.on('click', function() {
            var threshold = $('#id_notice_rate').val();
            var pair = $('#id_pair_for_alert').val();
            var over_or_under;

            if (threshold == '' || threshold == 0) {
                set_error_message(message_target,'通知金額を入力して下さい');
                return;
            }

            call_ticker('GET', pair)
            .done(function(res) {
                if (res.error) {
                    set_error_message($('#id_ajax_messsage'), res.error)
                    return;
                }
                if (parseFloat(threshold) >= parseFloat(res.buy)) {
                    over_or_under = '以上';
                } else {
                    over_or_under = '以下';
                }
                call_alerts('POST', null, pair, null, null, threshold, over_or_under)
                .done(function(res) {
                    
                    if (res.error) {
                        set_error_message($('#id_ajax_messsage'), res.error)
                        return;
                    }
                    set_success_message(message_target, 'アラートを追加しました');

                    $('#alerts_button').click();
                    message_target.show();
                })
                .fail(function(data, textStatus, xhr) {
                    if (data.status == 401) {
                        window.location.href = "{% url 'bitbank:login' %}";
                    }
                    set_error_message(message_target, xhr);
                });
            });
        });
        
        $pair_for_alert.html(option_html);

        var search_pair_option_html = '';
        
        search_pair_option_html += '<option value="all">全て</option>'; 
        Object.keys(PAIRS).forEach(pair => {
            search_pair_option_html += '<option value="' + pair + '">' + PAIRS[pair] + '</option>';
        });
        $search_pair.html(search_pair_option_html);
        $search_pair.on('change', function() {
            $.cookie(COOKIE_SEARCH_PAIR_ALERTS, $(this).val(), {expire: 7});
            initialize_alerts_content(message_target);
        });
    }
    console.log($pair_for_alert);
    var ck_alert_pair = $.cookie(COOKIE_ALERT_PAIR);
    if (ck_alert_pair != undefined && Object.keys(PAIRS).indexOf(ck_alert_pair) >= 0) {
        $pair_for_alert.val(ck_alert_pair).trigger('change');
    } else {
        $pair_for_alert.val(Object.keys(PAIRS)[0]).trigger('change');
    }
    var ck_search_pair_alerts = $.cookie(COOKIE_SEARCH_PAIR_ALERTS);
    if (ck_search_pair_alerts != undefined) {
        $search_pair.val(ck_search_pair_alerts).trigger('change');
    } else {
        $search_pair.val('all').trigger('change');
    }
}
function initialize_asset_tab(is_initial = false) {
    var message_target = $('#id_ajax_message');
    call_assets('GET')
    .done(response => {
        if (response.assets) {
            var asset_html = "";
            var total_asset_in_jpy = 0;
            response.assets.forEach(asset => {
                
                $('#' + asset.asset).html(asset.onhand_amount);
                if (asset.asset == 'ltc' || asset.asset == 'eth') {
                    call_ticker('GET', asset.asset + '_' + 'btc')
                    .done(function(res) {
                        if (res.error) {
                            set_error_message(message_target, res.error);
                            return;
                        }
                        call_ticker('GET', 'btc_jpy')
                        .done(function(res2) {
                            total_asset_in_jpy += parseInt(res.buy) * parseInt(res2.buy) * asset.onhand_amount;
                            $('#total_in_jpy').html(parseInt(total_asset_in_jpy));
                        })
                        .fail(function(data, textStatus, xhr) {
                            if (data.status == 401) {
                                window.location.href = "{% url 'bitbank:login' %}";
                            }
                            set_error_message(message_target, xhr);
                        });
                    })
                    .fail(function(data, textStatus, xhr) {
                        if (data.status == 401) {
                            window.location.href = "{% url 'bitbank:login' %}";
                        }
                        set_error_message(message_target, xhr);
                    });
                } else if (asset.asset != 'jpy') {
                    call_ticker('GET', asset.asset + '_jpy')
                    .done(function(res) {
                        if (res.error) {
                            set_error_message(message_target, res.error);
                            return;
                        }
                        total_asset_in_jpy += parseInt(res.buy * asset.onhand_amount);
                        $('#total_in_jpy').html(parseInt(total_asset_in_jpy));
                    })
                    .fail(function(data, textStatus, xhr) {
                        if (data.status == 401) {
                            window.location.href = "{% url 'bitbank:login' %}";
                        }
                        set_error_message(message_target, xhr);
                    });
                } else {
                    total_asset_in_jpy += parseInt(asset.onhand_amount);
                    $('#total_in_jpy').html(parseInt(total_asset_in_jpy));
                }
            });
            //$("#asset_table").html(asset_html);
        } else {
            if (response.error) {
                set_error_message(message_target, response.error);
            }
        }
    })
    .fail(function(data, textStatus, xhr) {
        if (data.status == 401) {
            window.location.href = "{% url 'bitbank:login' %}";
        }
        set_error_message(message_target, xhr);
    });
}
function initialize_user_info_tab(is_initial = false) {
    var message_target = $('#id_ajax_message');
    call_user('GET')
    .done(function(data) {
        if (data.error) {
            set_error_message(message_target, data.error);
            return;
        }
        console.log(data);
        $('#id_date_joined').html(return_formatted_datetime(Date.parse(data.date_joined), false));
        $('#id_email').html(data.email);
        $('#id_full_name').val(data.full_name);
        $('#id_api_key').val(data.api_key);
        $('#id_api_secret_key').val(data.api_secret_key);
        $('#id_email_for_notice').val(data.email_for_notice);
    })
    .fail(function(data, textStatus, xhr) {
        if (data.status == 401) {
            window.location.href = "{% url 'bitbank:login' %}";
        }
        set_error_message(message_target, xhr);
    });
    // 初期ロード時のみ
    if (is_initial) {
        $('#id_update_user_info_button').on('click', function() {
            var full_name = $('#id_full_name').val();
            var api_key = $('#id_api_key').val();
            var api_secret_key = $('#id_api_secret_key').val();
            var email_for_notice = $('#id_email_for_notice').val();

            if(!email_for_notice.match(/^([a-zA-Z0-9])+([a-zA-Z0-9\._-])*@([a-zA-Z0-9_-])+([a-zA-Z0-9\._-]+)+$/)){
                // 不正なメールアドレスの場合
                set_error_message(message_target, 'メールアドレスの形式が不正です');
                $('#id_email_for_notice').focus();
                return;
            }

            call_user('POST', full_name, api_key, api_secret_key, email_for_notice)
            .done(function(res) {
                if (res.error) {
                    set_error_message(message_target, res.error);
                    return;
                }
                set_success_message(message_target, '登録情報を更新しました');
                return;
            })
            .fail(function(data, textStatus, xhr) {
                if (data.status == 401) {
                    window.location.href = "{% url 'bitbank:login' %}";
                }
                set_error_message(message_target, xhr);
            });
        });
    }
}

function validate_contact_info(message_target) {
    //validations....
    var name = $('#id_contact_name');
    var email = $('#id_contact_email');
    var subject = $('#id_contact_subject');
    var body = $('#id_contact_body');
    
    if (name.val() == '') {
        set_error_message(message_target, '名前を入力してください');
        name.focus();
        return false;
    }
    if (email.val() == '') {
        set_error_message(message_target, '通知用メールアドレスを入力してください');
        email.focus();
        return false;
    }
    if (subject.val() == '') {
        set_error_message(message_target, '件名を入力してください');
        subject.focus();
        return false;
    }
    if (body.val() == '') {
        set_error_message(message_target, '内容を入力してください');
        body.focus();
        return false;
    }
    return true;
}



function initialize_contact_tab(is_initial = false) {
    var attachment_pk_list = [];
    var message_target = $('#id_contact_message');
    call_user('GET')
    .done(function(data) {
        if (data.error) {
            set_error_message(message_target, data.error);
            return;
        }
        $('#id_contact_date').html(return_formatted_datetime((new Date()).getTime(), false));
        $('#id_contact_email').val(data.email_for_notice);
        $('#id_contact_name').val(data.full_name);
    })
    .fail(function(data, textStatus, xhr) {
        if (data.status == 401) {
            window.location.href = "{% url 'bitbank:login' %}";
        }
        set_error_message(message_target, xhr);
    });
    // 初期ロード時のみ
    if (is_initial) {
        // var detach_button = $('#id_detach_file');
        var file_uploader = $('#fileupload');
        var attach_button = $('.js-upload-file');
        var inquiry_button = $('#id_contact_send_inquiry_button');
        var input_subject = $('#id_contact_subject');
        var input_body = $('#id_contact_body');
        var input_email = $('#id_contact_email');
        var preview_zone = $('#id_attachment_preview');
        var progress_bar = $('.progress');

        inquiry_button
        .on('click', function() {
            if (validate_contact_info(message_target)) {
                call_inquiry('POST', input_subject.val(), input_body.val(), input_email.val(), attachment_pk_list)
                .done(function(res) {
                    if (res.error) {
                        set_error_message(message_target, res.error);
                        return;
                    }
                    set_success_message(message_target, res.success);
                    return;
                })
                .fail(function(data, textStatus, xhr) {
                    if (data.status == 401) {
                        window.location.href = "{% url 'bitbank:login' %}";
                    }
                    set_error_message(message_target, xhr);
                });
            }
        });

        
        /* 2. INITIALIZE THE FILE UPLOAD COMPONENT */
        file_uploader.fileupload({
            dataType: 'json',
            singleFileUploads: true,
            autoUpload: true,
            replaceFileInput: false,
            done: function (e, data) {  /* 3. PROCESS THE RESPONSE FROM THE SERVER */
                if (data.result.error) {
                    //alert('error');
                    set_error_message(message_target, data.result.error);
                    return;
                }
                if (attachment_pk_list.length >= 3) {
                    set_error_message(message_target, '添付ファイルは3つまでです');
                    return;
                }
                attachment_pk_list.push(data.result.pk + '');
                
                $container = $('<div>', {
                    class: "container attachment_preview",
                    style: "width:30%;height:auto;float:left;position:relative"
                }).appendTo(preview_zone);

                $img_wrapper = $('<div>', {
                    style: "position:relative"
                })
                .appendTo($container)
                .on('click', function() {
                    var i = attachment_pk_list.indexOf($(this).attr('pk'));
                    attachment_pk_list.splice(i, 1);
                    call_attachment('DELETE', $(this).attr('pk'))
                    .done((data) => {
                        if (data.error) {
                            set_error_message(message_target, data.error);
                            return;
                        }
                        $(this).parent().remove();
                    })
                    .fail(function(data, textStatus, xhr) {
                        if (data.status == 401) {
                            window.location.href = "{% url 'bitbank:login' %}";
                        }
                        set_error_message(message_target, xhr);
                    });
                });

                $img = $('<img>', {
                    class: 'img-thumbnail',
                    id: 'file_' + data.result.pk,
                }).appendTo($img_wrapper);
                
                $('<div>', {
                    class: 'text',
                    text: '×'
                }).appendTo($img_wrapper);
                
                $('<p>', {
                    text: data.files[0].name,
                    style:"word-break : break-all;"
                }).appendTo($container);

                readURL(data.files[0], $img);
                
            },
            fail: function (e, data) {
                set_error_message(message_target, '失敗しました');
                return;
            }
        });
    }
}
function readURL(file, target_img) {
    if (file) {
        var reader = new FileReader();

        reader.onload = function (e) {
            $(target_img).attr('src', e.target.result);
        };

        reader.readAsDataURL(file);
    }
}
function set_error_message(target, message="ログインし直してください") {

    $(target).addClass('alert-danger');
    $(target).removeClass('alert-success');
    $(target).html(message);
    $(target).show();
    setTimeout(function() {
        $(target).fadeOut();
    }, 10000);
}

function set_success_message(target, message="正常に処理しました") {
    $(target).addClass('alert-danger');
    $(target).removeClass('alert-success');
    $(target).html('<i class="fa fa-check" aria-hidden="true"></i>' + message);
    $(target).show();
    setTimeout(function() {
        $(target).fadeOut();
    }, 2000);
}

function openTab(evt, tab_id) {

    $('#id_ajax_message').hide();
    $('#id_order_result_message').hide();
    $('#id_contact_message').hide();
    $.cookie(COOKIE_LAST_VISITED_TAB, tab_id, {expire: 7});
    switch( tab_id ) {
        case 'order':
            initialize_order_tab(false);
            break;
        case 'active_orders':
            initialize_active_orders_tab(false);
            break;
        case 'order_history':
            initialize_order_history_tab(false);
            break;
        case 'alerts':
            initialize_alerts_tab(false);
            break;
        case 'assets':
            initialize_asset_tab(false);
            break;
        case 'user_info':
            initialize_user_info_tab(false);
            break;
        case 'contact':
            initialize_contact_tab(false);
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


