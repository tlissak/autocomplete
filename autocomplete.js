/*
    Vanilla version of  jQuery autoComplete from : Simon Steinberger / Pixabay  https://github.com/Pixabay/jQuery-autoComplete
*/
var Autocomplete = function(elm,options){
    var that = this ;
    window.current_focus = null ;


    elm.setAttribute('autocomplete','off')


    this.elm = elm ;

    var div_container = document.createElement('div') ;
    div_container.className = 'autocomplete-suggestions' ;
    document.body.append(div_container)

    this.sc = div_container
    this.sc_hide = function (){
        this.sc.style.display = 'none' ;
    }
    this.sc_show = function(resize){

       //  console.log("show trigger 1",that.elm);

        window.current_focus = that ;

        that.sc.style.display = 'block';
        that.sc.style.top = that.elm.offsetTop + that.elm.offsetHeight ;
        that.sc.style.left = that.elm.offsetLeft + 'px' ;
        that.sc.style.width = that.o.width ? that.o.width : that.elm.outerWidth()
    };

    this.last_val = '';
    this.o = {...this.defaults , ...options }


    this.sc.addEventListener('mouseover',function (ev){
        sel = that.sc.querySelector('.autocomplete-suggestion.selected') ;
        if (sel) sel.classList.remove('selected')
        cur= ev.target.closest('.autocomplete-suggestion')
        if (cur) cur.classList.add('selected');
    })

    this.sc.addEventListener('click', function (e){
        //click wittin element
        console.log('click event fired');
        var selected_item = e.target.closest('.autocomplete-suggestion');
        if (! selected_item) return  ;

        return that.o.onSelect.call(that,that.elm,e,selected_item);
    });



    document.addEventListener('click', function(event) {
        var isClickInsideInput = div_container.contains(event.target);
        var isClickInsideContainer = elm.contains(event.target);
        if ( ! isClickInsideInput && !isClickInsideContainer ) {
            that.sc_hide();
        }
    });

    if (!this.o.minChars){

        //TODO
    }


    this.elm.addEventListener('focus', function(event){
        that.last_val = '\n';

        //console.log("focus trigger 2" , event.target);
        if (window.current_focus && window.current_focus !== that){
           //     console.log("unfocus",window.current_focus.elm);
            window.current_focus.sc_hide()
        }

        that.elm.dispatchEvent(new Event('input'));
    });

    this.elm.addEventListener('keyup', function(e){
        //console.log("input");
        if ((e.which === 40 /*arrow down*/ || e.which === 38 /*arrow up*/) && that.sc.innerHTML !=='') {
            var next, sel = that.sc.querySelector('.selected' );
            if (!sel) {
                next = (e.which === 40)
                    ? that.sc.querySelector('.autocomplete-suggestion:first-child')
                    : that.sc.querySelector('.autocomplete-suggestion:last-child')
                next.classList.add('selected');
            } else {
                next = (e.which === 40)
                    ? sel.nextElementSibling
                    : sel.previousElementSibling;
                if (next) {
                    sel.classList.remove('selected');
                    next.classList.add('selected')
                }else {
                    sel.classList.remove('selected');
                    next = 0;
                }
            }
            that.sc_show(0 /*, next */);
            return false;
        }else if (e.which === 27 /* escape  */) {
            //hat.value = that.last_val  ;
            that.sc_hide();

        }else if (e.which === 13 /* enter or tab */|| e.which === 9) {
            // trigger select the current selection
            var _sel =  that.sc.querySelector('.selected') ;
            var _sel_visible = (_sel && (!!( _sel.offsetWidth || _sel.offsetHeight || _sel.getClientRects().length )));

            if (_sel && _sel_visible) {
                that.o.onSelect.call(that,that.elm,e,_sel);
            }
        }
    });


     this.elm.addEventListener('input', function(e){

        //console.log('in',that,this,e.which)
        // console.log("input trigger");
         try{sessionStorage.setItem('autocomplete-search-value',that.elm.value);}catch (e){}
        if (! [13, 27, 35, 36, 37, 38, 39, 40].includes(e.which) ) {
            var val = that.elm.value;
            if (val.length >= that.o.minChars) {
                if (val !== that.last_val) {
                    that.last_val = val;
                    clearTimeout(that.timer);
                    if (that.o.cache) {

                        if (val in that.o.cache) {
                            that.o.suggest.call(that,that.o.cache[val]);
                            return;
                        }
                        // no requests if previous suggestions were empty
                        for (var i=1; i<val.length-that.o.minChars; i++) {
                            var part = val.slice(0, val.length-i);
                            if (part in that.o.cache && !Object.keys(that.o.cache[part]).length) {
                                //todo
                                that.o.suggest.call(that,[]);
                                return;
                            }
                        }
                    }
                    //console.log('timer call source callback is suggest') ;
                    that.timer = setTimeout(function(){ that.o.source.call(that,val, that.o.suggest) }, that.o.delay);
                }
            } else {
                that.last_val = val;
                that.sc_hide();
            }
        }
    })
}
Autocomplete.prototype.defaults = {
    source: 0,
    populate:function(){},
    suggest:function(data){
        var that = this ;
        var val = that.elm.value;
        that.o.cache[val] = data;
        if (data.length && val.length >= that.o.minChars) {
            that.sc.innerHTML = '';
            for (var i=0;i<data.length;i++) {
                that.sc.append(that.o.renderItem(data[i], val))
            }
            that.sc_show(0);
            that.o.populate(that);
        }
        else
            that.sc_hide();
    },
    minChars: 3,
    delay: 150,
    cache: {},
    width: null,
    menuClass: '',
    renderItem: function (item, search){
        // escape special characters
        search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        var re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
        return '<div class="autocomplete-suggestion" data-value="' + item + '">' + item.replace(re, "<b>$1</b>") + '</div>';
    },

    onSelect: function(that,field,ev,selected_item){
        field.value= selected_item.getAttribute('value');
        try{sessionStorage.setItem('autocomplete-search-value',field.value);}catch (e){}
        this.sc_hide() ;
        return false;
    }
};

/*
// Usage :

document.addEventListener('DOMContentLoaded',function(){

    new Autocomplete(document.querySelector('#j'),option_article);
    new Autocomplete(document.querySelector('#jq'),option_article);
    new Autocomplete(document.querySelector('#jq1'),option_article);

})

var option_article = {
    width: 'auto',
    minChars:2,
    suggest:function(data){
        var that = this ;
        var val = that.elm.value;
        that.o.cache[val] = data;
        if (data.length && val.length >= that.o.minChars) {
            that.sc.innerHTML = '';
            for (var i=0;i<data.length;i++) {
                //console.log(that.o.renderItem(data[i], val))
                that.sc.innerHTML += that.o.renderItem(data[i], val)
            }
            that.sc_show(0);
            that.o.populate(that);
        }
        else
            that.sc_hide();
    },
    menuClass: 'dropdown dropdown-menu dropdown-menu-responsive article-suggest',
    source: function(term, calback_src){
        var that = this;
        var src = document.querySelector('#res_markup').getAttribute('data-src') //+ '&q='+term+'&ajax=1' ;
        fetch(src)
            .then(response => {
                return response.json().then(function(returnData) {
                    calback_src.call(that,returnData);
                });
            })
    },
    renderItem: function (item, search){
        var markup = document.querySelector('#res_markup').textContent ;
        for(x in item) {
            markup = markup.replace(new RegExp('{'+x+'}', 'g'),(item[x] == null ? '-' :item[x]) );
        }
        return markup;
    },
    onSelect: function(field,ev,selected_item){
        field.value = selected_item.getAttribute('data-val') ;
        //console.log("selected" ,ev,field,field.value,selected_item,this );
        this.sc_hide() ;
        return false;

    }
};

 */
