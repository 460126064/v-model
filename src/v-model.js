function Vue(options) {
	 //获取data
   this.data = options.data;
   this.$el = this.query(options.el);
   //获取render函数
   this.render = options.render;
   //数据初始化绑定
   this.initData(this.data);
   //模板编译
   this.compile();
}
Vue.prototype = {
	 constructor : Vue,
	 $mount(el) {
      if(!el) throw new Error('element must be require');
      if(el === document.body || el === document.documentElement) throw new Error('Do not mount Vue to <html> or <body>');
      if(this.render) {
      	//如果有render函数
      }else {
      	//没有我们直接读取挂载器下节点
      	if(el.outerHTML) {
      		this.template = el.outerHTML
      	}else {
      		//如果不支持outerHTML我们获取innerhtml
      		let container = document.createElement('div');
      		container.appenChild(el.cloneNode(true));
              this.template = container.innerHTML;
      	}
      }                
	 },
	 query(str) {
      if(typeof str === 'string') {
      	let selector = document.querySelector(str);
      	if(!selector) {
      		console.error('Cannot find element: ' + el)
      	    return document.createElemnt('div');
      	}
      	return selector;
      } else if(typeof str === 'object' && str.nodeType === 1) {
          return str;
      } else {
      	console.error(el + 'type error');
      	return document.createElemnt('div');
      }
	 },
	 initData(data) {
	 	 //获取每一项key进行数据初始化
	 	 Object.keys(data).forEach((key) => {
           //每一个属性都有一个单独的观察者实例；
           let dep = new Dep();
           Object.defineProperty(this,key,{
           	 get() {
                  //如果当前依赖值存在添加到队列中
                  if(Dep.target) dep.add(Dep.target);
                  return data[key]
           	 },
           	 set(newVal) {
           	 	//如果设置的值与当前值相同直接return
                  if(newVal === data[key]) return;
                  //改变当前值
                  data[key] = newVal;
                  //触发观察者通知
                  dep.fire();
           	 }
           })
	 	 })
	 },
	 //模板编译
	 compile() {
        //创建一个dom片段
        let flag = document.createDocumentFragment();
        let defaultTagRE = /\{\{\s*(\w*)\s*\}\}/;
        //节点递归查询
        function step($el) {
            $el.childNodes.forEach((node) => {
                 if(node.nodeType === 1) {
                     //获取节点所有属性
                     let attrSet = node.attributes;
                     //遍历属性,属性数组不支持forEach方法
                     Array.from(attrSet).forEach((item) => {
                         if(item.nodeName === 'v-model') {
                            let val =  node.nodeName.toLowerCase() === 'input' ? 'value' : 'innerText';
                             node[val] = this[item.nodeValue];
                             new Watch(this,node,item.nodeValue,val);
                             node.addEventListener('input', (e) => {
                                 this[item.nodeValue] = node.value;
                             }, false)
                             node.removeAttribute(item);
                         }
                     })
                     if(node.childNodes.length) step.call(this,node);
                     //文本节点
                 }else if(node.nodeType === 3) {                             
                     if(defaultTagRE.test(node.nodeValue)) {
                        node.nodeValue = this[RegExp.$1.trim()];
                        new Watch(this,node,RegExp.$1.trim(),'nodeValue');
                     }
                 }
            })
        }
        return step.call(this,this.$el);
	 },

}
//监听器,便利DOM节点时添加Watch监听
let Watch = function(vm,node,name,nodeType) {
   //全局变量,当前监听对象
   Dep.target = this; 
   //节点类型
   this.nodeType = nodeType;
   //变量名称
   this.name = name;
   //节点
   this.node = node;
   //Vue实例
   this.$vm = vm;
   //触发更新方法；
   this.update()
   //改变target防止多次push进入观察者队列
   Dep.target = null;
}
Watch.prototype = {
   update() {
       //调取get方法
       this.get();
       //赋值
       this.node[this.nodeType] = this.value;
   },
   get() {
      //创建value值，同时触发监听set方法
      this.value = this.$vm[this.name]
   }
}
//观察者,每个都创建对应的实例，或者使用命名空间
let Dep = function(){
   this.subs = [];
}
Dep.prototype = {
     constructor : Dep,
     add(sub) {
        this.subs.push(sub)
     },
     fire() {
        this.subs.forEach(sub => sub.update());
     }
}