import { observable, makeObservable, action } from "mobx";

class GlobalStore {
    // 定义变量
    @observable accessToken: string = "";
    @observable bigcodeUrl: string = "";
    
    constructor() {
        makeObservable(this);
    }

    // 可以被立即响应的操作函数
    @action
    setAccessToken(token: string) {
        this.accessToken = token;
    }

    @action
    setBigcodeUrl(url: string) {
        this.bigcodeUrl = url;
    }

}

export default new GlobalStore();
export interface IGlobalStore extends GlobalStore { }