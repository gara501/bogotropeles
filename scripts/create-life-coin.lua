-- Native Aseprite pixel-art source: Colombian $1000 extra-life pickup.
-- Draw at 32x32 logical pixels, export at 2x using exact pixel replication.
local root='T:/CODE/JSProjects/streetBogota/'
local palette={
  '211C27','63452B','9F702C','D3A747','F3D576','FFF0AC',
  '454D59','75818D','A6B3BC','D6DDE0','F6F3DC'
}
local colors={}
for i,hex in ipairs(palette) do colors[i]=app.pixelColor.rgba(tonumber(hex:sub(1,2),16),tonumber(hex:sub(3,4),16),tonumber(hex:sub(5,6),16),255) end
local image=Image(32,32)
local function pixel(x,y,c) if x>=0 and y>=0 and x<32 and y<32 then image:drawPixel(x,y,colors[c]) end end
local function disk(x,y,r) return (x-15.5)^2+(y-15.5)^2<=r*r end
for y=1,30 do for x=1,30 do
  if disk(x,y,14.7) then
    local c=1
    if disk(x,y,13.6) then c=(x+y<30) and 5 or 3 end
    if disk(x,y,12.6) then c=4 end
    if disk(x,y,11.5) then c=2 end
    if disk(x,y,10.6) then c=(x+y<30) and 10 or 9 end
    if disk(x,y,9.7) then c=9 end
    pixel(x,y,c)
  end
end end
-- Broken rim engraving and upper-left metal highlights: deliberate clusters.
for _,p in ipairs({{8,5},{11,3},{15,3},{19,3},{23,5},{26,8},{28,12},{28,16},{27,21},{24,25},{20,28},{15,28},{10,27},{6,24},{3,19},{3,14},{4,9}}) do pixel(p[1],p[2],2) end
for x=10,20 do pixel(x,2,6) end
for y=8,19 do if disk(2,y,14.7) then pixel(2,y,5) end end
for x=8,23 do if disk(x,28,13.6) then pixel(x,28,3) end end
-- Readable embossed denomination, no microscopic circular lettering.
local digits={['1']={'010','110','010','010','111'},['0']={'111','101','101','101','111'}}
for i=1,4 do
  local glyph=digits[('1000'):sub(i,i)]
  for y=1,5 do for x=1,3 do if glyph[y]:sub(x,x)=='1' then pixel(7+(i-1)*4+x,7+y,7) end end end
end
-- Stylized loggerhead turtle relief and two rows of waves from the real coin.
for y=16,19 do for x=12,19 do if (x-15.5)^2/16+(y-17.5)^2/4<=1 then pixel(x,y,8) end end end
for _,p in ipairs({{20,17},{21,17},{12,16},{11,15},{12,19},{11,20},{18,16},{19,15},{18,19},{19,20}}) do pixel(p[1],p[2],7) end
for _,p in ipairs({{14,16},{15,16},{14,17},{17,18},{18,18}}) do pixel(p[1],p[2],10) end
for _,y in ipairs({22,25}) do for x=8,23 do
  if disk(x,y,9.9) then pixel(x,y+((x%6<3) and 0 or -1),8) end
end end
local native=Sprite(32,32,ColorMode.RGB)
native.layers[1].name='Moneda colombiana 1000 pesos'
native:newCel(native.layers[1],1,image,Point(0,0))
local pal=Palette(#palette+1)
pal:setColor(0,Color{r=0,g=0,b=0,a=0})
for i,hex in ipairs(palette) do pal:setColor(i,Color{r=tonumber(hex:sub(1,2),16),g=tonumber(hex:sub(3,4),16),b=tonumber(hex:sub(5,6),16),a=255}) end
native:setPalette(pal)
native:saveAs(root..'src/data/items/item_life_coin.aseprite')
local output=Image(64,64)
for y=0,31 do for x=0,31 do local c=image:getPixel(x,y)
  for dy=0,1 do for dx=0,1 do output:drawPixel(x*2+dx,y*2+dy,c) end end
end end
output:saveAs(root..'src/data/items/item_life_coin.png')
local preview=Image(256,256)
for y=0,31 do for x=0,31 do local c=image:getPixel(x,y)
  for dy=0,7 do for dx=0,7 do preview:drawPixel(x*8+dx,y*8+dy,c) end end
end end
preview:saveAs(root..'output/life_coin_preview.png')
