import React from "react";
import { SideArea } from "./SideArea";

let islandMat = null,
    pirateShipMat = null,
    nativeVillageMat = null;
class IslandMat extends SideArea{
    constructor(props){
        super(props, 'IslandMat');
        islandMat = this;
    }
}
class PirateShipMat extends SideArea{
    constructor(props){
        super(props, 'PirateShipMat');
        pirateShipMat = this;
    }
}
class NativeVillageMat extends SideArea{
    constructor(props){
        super(props, 'NativeVillageMat');
        nativeVillageMat = this;
    }
}

function getIslandMat(){
    return islandMat;
}
function getPirateShipMat(){
    return pirateShipMat;
}
function getNativeVillageMat(){
    return nativeVillageMat;
}

export {IslandMat, PirateShipMat, NativeVillageMat,
    getIslandMat, getPirateShipMat, getNativeVillageMat};

