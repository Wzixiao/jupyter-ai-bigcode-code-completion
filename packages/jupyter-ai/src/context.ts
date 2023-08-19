// import { observable, makeObservable, action } from "mobx";

// class GlobalStore {
//     // 定义变量
//     @observable count: number = 0;

//     constructor() {
//         makeObservable(this);
//     }

//     // 可以被立即响应的操作函数
//     @action
//     increment() {
//         this.count += 1;
//     }

//     incrementCount() {
//         this.increment();
//     }
// }

// export default new GlobalStore();
// export interface IGlobalStore extends GlobalStore { }