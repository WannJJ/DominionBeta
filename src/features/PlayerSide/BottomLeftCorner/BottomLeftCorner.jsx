import React from "react";
import { PlayArea, SetAside, Exile } from "./SideArea";
import { IslandMat, PirateShipMat, NativeVillageMat } from "./PlayerMats";

class BottomLeftCorner extends React.Component{
    render(){
        return <div id='bottom-left-corner'>
            <PlayArea />
            <SetAside />
            <Exile />

            <IslandMat />
            <PirateShipMat />
            <NativeVillageMat />
        </div>
    }
}

export {BottomLeftCorner};