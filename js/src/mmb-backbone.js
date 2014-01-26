var MMB_Backbone = {

    View_navbar: Backbone.View.extend({
        el: '#navbar-collapse',
        template: _.template($('#navbar').html()),
        events: {
            "click .js-sign-out": "sign_out"
        },
        sign_out: function(e){
            e.preventDefault();
            if(MMB.dropbox_ok){
                MMB.dropbox_client.signOut();
                MMB.dropbox_ok = false;
            }
            MMB.render('dropbox_sign_in');
            return this;
        },
        render: function(){
            $('#navbar-collapse').html(this.template());
            return this;
        }
    }),

    View_need_config: Backbone.View.extend({
        template: _.template($('#page-need-config').html()),
        render: function(){
            $('.body').html(this.template());
            return this;
        }
    }),

    View_no_network: Backbone.View.extend({
        template: _.template($('#page-no-network').html()),
        render: function(){
            $('.body').html(this.template());
            return this;
        }
    }),

    View_dropbox_sign_in: Backbone.View.extend({
        el: ".body",
        template: _.template($('#page-dropbox-sign-in').html()),
        events: {
            "click .js-dropbox-sign-in": "dropbox_sign_in"
        },
        dropbox_sign_in: function(){
            MMB.dropbox_client = new Dropbox.Client({key: MMB_Config.app_key});

            // Try to finish OAuth authorization.
            MMB.dropbox_client.authenticate({interactive: true}, function (error) {
                if (error) {
                    alert('Authentication error: ' + error);
                }
            });
            return this;
        },
        render: function(){
            $('.body').html(this.template());
            return this;
        }
    }),

    View_register: Backbone.View.extend({
        el: '.body',
        template: _.template($('#page-register').html()),
        just_date: null,
        render: function(){
            var date,
                vars,
                category_placeholder,
                tmp;

            tmp = _.random(0, MMB.category.length - 1);

            category_placeholder = MMB.category[tmp];

            if(this.just_date){
                date = this.just_date;
            }else{
                date = moment().format('YYYY-MM-DD');
            }

            vars = {
                date: date,
                category_placeholder: category_placeholder
            };
            $('.body').hide().html(this.template(vars)).fadeIn();
            return this;
        },
        events: {
            "submit .js-register-form": "register",
            "click #behavior_type": "toggle_transfer_item",
            "keyup #memo": "auto_complete_memo",
            "click .js-memo-candidate": "select_memo_candidate",
            "focus #amount": function(){
                $('.js-amount-auto-complete').fadeIn();
            },
            "focus #category": function(){
                $('.js-category-auto-complete').fadeIn();
            },
            "blur #date": "set_just_date",
            "click .js-memo-related-candidate": "select_memo_related_candidate"
        },
        register: function(e){
            e.preventDefault();
            var data_arr = $('.js-register-form').serializeArray(),
                data = {};
            _.forEach(data_arr, function(entry){
                data[entry.name] = entry.value;
            });

            data.year = data.date.substr(0, 4);
            data.month = data.date.substr(5, 2);
            data.day = data.date.substr(8, 2);
            data.cat1 = data.category.split(':')[0];
            data.cat2 = data.category.split(':')[1] ? data.category.split(':')[1] : '';

            delete data.category;
            delete data.date;

            MMB.register(data);

            return this;
        },
        toggle_transfer_item: function(e){
            if($(e.target).val() === 'transfer'){
                $('.js-transfer-item').find('input').prop('disabled', false);
                $('.js-transfer-item').fadeIn();
            }else{
                $('.js-transfer-item').find('input').prop('disabled', true);
                $('.js-transfer-item').fadeOut();
            }
        },
        auto_complete_memo: function(e){
            var tem = _.template($('#template-memo-auto-complete').html()),
                vars,
                memo_data = [],
                value = $(e.target).val().trim(),
                pattern = new RegExp(value);

            if(value){
                _.forEach(MMB.memo_data, function(entry){
                    if(pattern.test(entry.key)){
                        memo_data.push(entry);
                    }
                });

                _.sortBy(memo_data, function(entry){
                    return entry.count;
                });
            }

            vars = {
                memo_data: memo_data
            };
            $('.js-memo-auto-complete').fadeIn().html(tem(vars));
        },
        select_memo_candidate: function(e){
            e.preventDefault();
            var memo = $(e.target).data('memo');
            $('#memo').val(memo);
            $('.js-memo-auto-complete').text('');
            this.auto_complete_memo_related();
            $('#amount').focus();
        },
        auto_complete_memo_related: function(){
            var record, vars, related,
                tem = _.template($('#template-memo-related-auto-complete').html()),
                types = ['amount', 'category', 'account'];

            // set amount
            record = MMB.datastore.auto_complete.query({
                type: 'memo_related',
                memo: $('#memo').val()
            })[0];
            if(record){
                _.forEach(types, function(type){
                    related = JSON.parse(record.get('related'));
                    _.sortBy(related[type], function(entry){
                        return entry.count;
                    });

                    vars = {
                        type: type,
                        target: '#' + type,
                        list: related[type]
                    };
                    $('.js-' + type + '-auto-complete').html(tem(vars));
                });
            }
        },
        set_just_date: function(){
            this.just_date = $('#date').val();
        },
        select_memo_related_candidate: function(e){
            var target = $(e.target).data('target'),
                key = $(e.target).data('key'),
                $next_input;

            e.preventDefault();

            $(target).val(key);
            $next_input = $(e.target).parents('.form-group').next('.form-group:visible').find('input');
            $(e.target).parent().fadeOut();

            if($next_input.length > 0){
                $next_input.focus();
            }
        }
    }),

    View_setting: Backbone.View.extend({
        el: ".body",
        template: _.template($('#page-setting').html()),
        events: {
            "click input" : "save_setting",
            "blur" : "save_setting",
            "click .js-delete-all-data": "delete_all_data"
        },
        render: function(){
            var vars;
            vars = {
                language: MMB.get_lang(),
                category_depth: MMB.get_category_depth()
            };
            $('.body').hide().html(this.template(vars)).fadeIn();
            return this;
        },
        save_setting: function(){
            var setting = {},
                value_obj = $('.js-form-setting').serializeArray();
            _.each(value_obj, function(obj){
                MMB.set_setting(obj.name, obj.value);
            });
            MMB.reset_category();
            return this;
        },
        delete_all_data: function(){
            if(confirm(polyglot.t("Really? You can't restore data."))){
                var all_data = MMB.datastore.content.query();
                _.forEach(all_data, function(record){
                    record.deleteRecord();
                });

                all_data = MMB.datastore.etc.query();
                _.forEach(all_data, function(record){
                    record.deleteRecord();
                });

                all_data = MMB.datastore.auto_complete.query();
                _.forEach(all_data, function(record){
                    record.deleteRecord();
                });

                alert(polyglot.t("All data deleted."));
            }
        }
    }),

    View_import: Backbone.View.extend({
        el: ".body",
        template: _.template($('#page-import').html()),
        render: function(){
            var vars = {};
            $('.body').hide().html(this.template(vars)).fadeIn();
            return this;
        },
        events: {
            "dragenter .xls-drop-area": "drag_handle",
            "dragover .xls-drop-area": "drag_handle",
            "dragleave .xls-drop-area": "drag_leave",
            "drop .xls-drop-area": "drop_process"
        },
        drag_leave: function(e){
            $(e.target).removeClass('dragging');
        },
        xlsworker: function (data, cb) {
            var worker = new Worker('js/xlsworker.js');
            worker.onmessage = function(e) {
                switch(e.data.t) {
                    case 'ready': break;
                    case 'e': console.error(e.data.d);
                    case 'xls': cb(e.data.d); break;
                }
            };
            worker.postMessage(data);
        },
        drop_process: function(e){
            $(e.target).removeClass('dragging');
            var that = this,
                files,
                i,
                f;
            e.originalEvent.stopPropagation();
            e.originalEvent.preventDefault();
            
            files = e.originalEvent.dataTransfer.files;
            for (i = 0, f = files[i]; i != files.length; ++i) {
                var reader = new FileReader();
                // var name = f.name;
                reader.onload = function(e) {
                    var data = e.target.result;
                    if(typeof Worker !== 'undefined') {
                        that.xlsworker(data, that.process_wb);
                    } else {
                        var cfb = XLS.CFB.read(data, {type: 'binary'});
                        //var arr = String.fromCharCode.apply(null, new Uint8Array(data));
                        //var cfb = XLS.CFB.read(btoa(arr), {type: 'base64'});
                        var wb = XLS.parse_xlscfb(cfb);
                        that.process_wb(wb);
                    }
                };
                reader.readAsBinaryString(f);
                //reader.readAsArrayBuffer(f);
            }
        },
        process_wb: function (wb) {
            var that = MMB.pages.import;
            var output = that.to_csv(wb),
                rows;

            rows = output.split('\n');

            if(/지출 현황/.test(rows[2])){
                that.import_naver_withdrawal(rows);
            }else if(/수입 현황/.test(rows[2])){
                that.import_naver_deposit(rows);
            }else{
                alert("네이버에서 다운받은 엑셀이 아닌 것 같습니다.");
            }
        },
        import_naver_withdrawal: function (rows){
            var sheet1 = [],
                sheet2 = [],
                data = [],
                item,
                amount,
                i = 1;

            sheet1 = this.get_content_rows(rows);

            _.forEach(sheet1, function(row){
                amount = row[3];

                if(amount !== '' && /[0-9]+/.test(amount.replace(/,/g, ''))){
                    sheet2.push(row);
                }
            });

            _.forEach(sheet2, function(row){
                item = {
                    behavior_type: 'withdrawal',
                    memo: row[2],
                    amount: parseInt(row[3].replace(/,/g, '')) + parseInt(row[4].replace(/,/g, '')),
                    account: (row[5] == '' ? '내 지갑' : row[5]),
                    cat1: row[7].split('>')[0],
                    cat2: row[7].split('>')[1] ? row[7].split('>')[1] : '',
                    year: row[0].substr(0, 4),
                    month: row[0].substr(5, 2),
                    day: row[0].substr(8, 2)
                };
                if(/이체\/대체>/.test(row[7])){
                    item.behavior_type = 'transfer';
                    item.to_account = row[7].replace(/이체\/대체>/, '');
                }
                data.push(item);
            });


            _.forEach(data, function(row){
                setTimeout(function(){
                    $('.js-msg').removeClass('hidden').addClass('in').html(row.memo + ' 입력...');
                    MMB.register(_.clone(row));
                }, i*50);
                i++;
            });

            setTimeout(function(){
                $('.js-msg').removeClass('in').addClass('hidden').html('');
            }, (i+1)*50);

            return this;
        },
        import_naver_deposit: function (rows){
            var sheet1,
                sheet2 = [],
                data = [],
                item,
                amount,
                i = 1;

            sheet1 = this.get_content_rows(rows);

            _.forEach(sheet1, function(row){
                amount = row[2];

                if(amount !== '' && /[0-9]+/.test(amount.replace(/,/g, ''))){
                    sheet2.push(row);
                }
            });

            _.forEach(sheet2, function(row){
                item = {
                    behavior_type: 'deposit',
                    memo: row[1],
                    amount: parseInt(row[2].replace(/,/g, '')),
                    account: (row[3] == '' ? '내 지갑' : row[3]),
                    cat1: row[4].split('>')[0],
                    cat2: row[4].split('>')[1] ? row[4].split('>')[1] : '',
                    year: row[0].substr(0, 4),
                    month: row[0].substr(5, 2),
                    day: row[0].substr(8, 2)
                };
                data.push(item);
            });

            _.forEach(data, function(row){
                setTimeout(function(){
                    MMB.register(_.clone(row));
                }, i*50);
                i++;
            });

            return this;
        },
        get_content_rows: function(rows){
            var sheet1 = [];

            _.forEach(rows, function(row){
                if(/[0-9]{4}년[0-9]{1,2}월[0-9]{1,2}일/.test(row)){
                    sheet1.push(row.replace(/"/g, '').split('\t'));
                }
            });
            return sheet1;
        },
        drag_handle: function(e) {
            e.originalEvent.stopPropagation();
            e.originalEvent.preventDefault();
            e.originalEvent.dataTransfer.dropEffect = 'copy';
            $(e.target).addClass('dragging');
        },
        to_json: function (workbook){
            var result = {};
            workbook.SheetNames.forEach(function(sheetName) {
                var roa = XLS.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                if(roa.length > 0){
                    result[sheetName] = roa;
                }
            });
            return result;
        },
        to_csv: function (workbook) {
            var result = [];
            workbook.SheetNames.forEach(function(sheetName) {
                var csv = XLS.utils.make_csv(workbook.Sheets[sheetName]);
                if(csv.length > 0){
                    result.push("SHEET: " + sheetName);
                    result.push("");
                    result.push(csv);
                }
            });
            return result.join("\n");
        }
    }),

    View_weekly: Backbone.View.extend({
        el: ".body",
        events: {
            "click .js-weekly-change-date": "change_date",
            "click .js-weekly-change-days-btn": "change_days"
        },
        change_date: function(){
            location.href = '#weekly/' + $('.js-weekly-basic-date').val();
        },
        change_days: function(e){
            var current = $('.js-weekly-basic-date').val(),
                days = $(e.target).data('days'),
                target_date = moment(current, 'YYYY-MM-DD').add('days', days).format('YYYY-MM-DD');

            location.href = '#weekly/' + target_date;
        },
        template: _.template($('#page-weekly').html()),
        render: function(opts){
            var that = this,
                i,
                week_data = [],
                list,
                date,
                day_of_the_week,
                sum = {};

            if(opts === undefined || opts.date === undefined){
                opts = {
                    date: moment().format('YYYY-MM-DD')
                }
            }

            if( ! MMB.datastore.content){
                setTimeout(function(){
                    that.render(opts);
                }, 500);
            }else{
                for(i = 0; i < 7; i++){
                    var query_opt = {
                        year: moment(opts.date, 'YYYY-MM-DD').subtract('days', i).format('YYYY'),
                        month: moment(opts.date, 'YYYY-MM-DD').subtract('days', i).format('MM'),
                        day: moment(opts.date, 'YYYY-MM-DD').subtract('days', i).format('DD')
                    };
                    list = MMB.datastore.content.query(query_opt);

                    date = moment(opts.date, 'YYYY-MM-DD').subtract('days', i).format('YYYY-MM-DD');
                    day_of_the_week = moment(opts.date, 'YYYY-MM-DD').subtract('days', i).format('dd');
                    sum[date] = 0;

                    _.forEach(list, function(record){
                        if(record.get('behavior_type') === 'withdrawal'){
                            sum[date] += record.get('amount');
                        }
                    });

                    week_data.push({
                        date: date,
                        day_of_the_week: day_of_the_week,
                        list: list,
                        sum: sum
                    });
                }

                vars = {
                    week_data: week_data
                };
                $('.body').hide().html(this.template(vars)).fadeIn();

                return this;
            }

        }
    })
};