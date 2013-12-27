var polyglot = new Polyglot();

var MMB_Backbone = {
    View_navbar: Backbone.View.extend({
        template: _.template($('#navbar').html()),
        render: function(){
            $('#navbar-collapse').html(this.template());
        }
    }),
    View_register: Backbone.View.extend({
        template: _.template($('#page-register').html()),
        render: function(){
            var date = new Date(),
                month = date.getMonth() + 1,
                today = date.getFullYear() + '-' + month + '-' + date.getDate(),
                vars;
            vars = {
                today: today
            };
            $('.body').hide().html(this.template(vars)).fadeIn();
        }
    }),
    View_setting: Backbone.View.extend({
        el: ".body",
        template: _.template($('#page-setting').html()),
        events: {
            "click input" : "save_setting",
            "blur" : "save_setting"
        },
        render: function(){
            var vars;
            vars = {
                language: MMB.get_lang()
            };
            $('.body').hide().html('').html(this.template(vars)).fadeIn();
        },
        save_setting: function(){
            var setting = {},
                value_obj = $('.js-form-setting').serializeArray();
            _.each(value_obj, function(obj){
                localStorage[obj.name] = obj.value;
            });
        }
    })
};

var MMB = {
    initialize: function(){
        this.set_polyglot();
        this.show_navbar();
        this.show_start_page();
        this.provide_data_source();
        this.bind_menu_event();
    },
    view_register: new MMB_Backbone.View_register(),
    view_setting: new MMB_Backbone.View_setting(),
    view_navbar: new MMB_Backbone.View_navbar(),
    set_polyglot: function(){
        polyglot.extend(Lang[this.get_lang()]);
    },
    get_lang: function(){
        var user_lang = navigator.language || navigator.userLanguage,
            lang = localStorage.getItem('language');

        if(lang == null){
            user_lang = user_lang.substr(0, 2).toLowerCase();

            if(user_lang == 'ko'){
                lang = 'ko';
            }else{
                lang = 'en';
            }
        }
        return lang;
    },
    show_navbar: function(){
        this.view_navbar.render();
    },
    show_page: function(page_name){
        this['view_' + page_name].render();
    },
    show_start_page: function(){
        this.show_page('setting');
    },
    provide_data_source: function(){
        $('.js-category').data('source', ['Food:Dining', 'Food:Morning']);
        $('.js-account').data('source', ['My Wallet', 'Hana Bank']);
    },
    bind_menu_event: function(){
        var that = this;
        $('[data-page]').click(function(e){
            e.preventDefault();
            var page_name = $(this).data('page');
            that.show_page(page_name);
        });
    },
    if_checked: function(db_value, field_value){
        if(db_value == field_value){
            return ' checked ';
        }else{
            return '';
        }
    }
};

MMB.initialize();