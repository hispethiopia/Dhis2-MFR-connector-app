import { CircularLoader, Layer } from "@dhis2/ui";
import React from "react";
const fullScreenLoaderStyle = `
.fullScreenLoader {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.8); /* Optional: Adds a white overlay */
    z-index: 9999; /* Ensure it's on top of other content */
}
`;

export const FullScreenLoader: React.FC = () => (
    <Layer>
        <style>
            {fullScreenLoaderStyle}
        </style>
        <div className="fullScreenLoader">
            <CircularLoader large />
        </div>
    </Layer>
)