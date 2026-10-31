-- 给当前账号补两条演示分享（原示例帖已被用户删除）
INSERT INTO travel_post (username, destination_id, content, images, like_count, created_at) VALUES
('fickle', 21, '龙门石窟去了一趟，卢舍那大佛那一龛下午的光线最好。走完东西两山大概三小时，穿舒服的鞋。', '/img/destinations/luoyang.jpg', 0, NOW() - INTERVAL 6 HOUR),
('fickle', 2, '杭州秋天真的很适合逛，西湖边走走、河坊街吃点东西，一天就过去了。', '/img/destinations/suzhou.jpg', 0, NOW() - INTERVAL 2 DAY);