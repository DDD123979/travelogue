-- 给新增的 6 个城市补封面图（图片放在 travel-app/img/destinations/）

UPDATE destination SET image = 'img/destinations/chongqing.jpg' WHERE id = 15;
UPDATE destination SET image = 'img/destinations/guilin.jpg' WHERE id = 16;
UPDATE destination SET image = 'img/destinations/suzhou.jpg' WHERE id = 17;
UPDATE destination SET image = 'img/destinations/qingdao.jpg' WHERE id = 18;
UPDATE destination SET image = 'img/destinations/zhangjiajie.jpg' WHERE id = 19;
UPDATE destination SET image = 'img/destinations/dunhuang.jpg' WHERE id = 20;
