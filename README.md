# 3DMobileModuleAppSim
This is a NodeJS & WebGL based 3D Mobile Module (such as SierraWireless) Application Simulator for Demo purposes 

## Build 
```
git clone https://github.com/tseiman/3DMobileModuleAppSim
cd 3DMobileModuleAppSim
npm install
npm install --ignore-scripts fomantic-ui
cd node_modules/fomantic-ui
```

See as well https://github.com/fomantic/Fomantic-UI/issues/1990

```
npx gulp install
```
select Express, change the following parameter to *static/semantic*:
```
Where should we put Fomantic UI inside your project? static/semantic
```
then start the build:
```
npx gulp build
```
it will create a sub folder *semantic* in the static/ folder
