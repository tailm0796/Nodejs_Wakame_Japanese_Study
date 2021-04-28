const models = require('../models');
const search = require('../utils/multiSearch');
exports.get_homePage = function (req, res, next) {
    var xacnhan = false;
    req.session.ten = 'tai';
    if (req.isAuthenticated()) {
        xacnhan = true;
        return res.render('index', {
            title: 'Express',
            Authenticated: xacnhan,
            user_name: req.user.dataValues.fullName,
            user_email: req.user.dataValues.email
        });
    }
    else {
        return res.render('index', {
            title: 'Express',
            Authenticated: xacnhan
        });
    }

}
exports.get_aboutPage = function (req, res, next) {
    req.session.redirectTo = '/about';
    var xacnhan = false;
    if (req.isAuthenticated()) {
        xacnhan = true;
        return res.render('about', {
            title: 'Express',
            Authenticated: xacnhan,
            user_name: req.user.dataValues.fullName,
            user_email: req.user.dataValues.email
        });
    }
    else {
        return res.render('about', {
            title: 'Express',
            Authenticated: xacnhan
        });
    }

}
exports.get_blogPage = async function (req, res, next) {
    req.session.redirectTo = '/blog';
    var page = req.query.page || 1;
    var itemPerPage = 4;
    var begin = (page - 1) * itemPerPage;
    var end = page * itemPerPage;
    var blogs = await models.BLOG.findAll({
        attributes: ['uuid', 'title', 'blogimg', 'content', 'description', 'createdAt'],
        include: ['blog_user', 'blog_comment'],
    });
    var tags = await models.TAG.findAll({
        attributes: ['TEN_TAG']
    });
    var categories = await models.CATEGORY.findAll({
        include: ['category_blog']
    });
    var numOfPage = Math.ceil(blogs.length / itemPerPage);
    return res.render('blog', {
        Authenticated: req.isAuthenticated(),
        user_name: req.isAuthenticated() ? req.user.dataValues.fullName : '',
        blogs: blogs,
        begin: begin,
        end: end,
        tags: tags,
        categories: categories,
        numOfPage: numOfPage,
    });
}
exports.get_searchBlogPage = async function (req, res, next) {
    var words = req.query.q ? req.query.q.split(" ") : '';
    var itemPerPage = 4;
    var page = req.query.page || 1;
    var begin = (page - 1) * itemPerPage;
    var end = page * itemPerPage;
    var category = req.query.category ? req.query.category : '';
    console.log(category);
    var blogs = [];
    var foundBlogs = [];
    if (words.length > 0) {
        blogs = await models.BLOG.findAll({
            attributes: ['uuid', 'title', 'blogimg', 'content', 'description', 'createdAt'],
            include: ['blog_user', 'blog_comment'],
        });
        blogs.forEach((blog) => {
            if (search.multiSearchOr(blog.content, words) == "Found!") {
                foundBlogs.push(blog);
            }
        });
    }
    if (category) {
        blogs = await models.BLOG.findAll({
            attributes: ['uuid', 'title', 'blogimg', 'content', 'description', 'createdAt'],
            include: [
                'blog_user',
                'blog_comment',
                {
                    model: models.CATEGORY,
                    as: 'blog_category',
                    where: {
                        name: category,
                    }
                }
            ],
        });
        foundBlogs = blogs;
    }

    var categories = await models.CATEGORY.findAll({
        include: ['category_blog']
    });

    var tags = await models.TAG.findAll({
        attributes: ['TEN_TAG']
    });
    var numOfPage = Math.ceil(foundBlogs.length / itemPerPage);
    return res.render('blog', {
        Authenticated: req.isAuthenticated(),
        user_name: req.isAuthenticated() ? req.user.dataValues.fullName : '',
        blogs: foundBlogs,
        begin: begin,
        end: end,
        tags: tags,
        categories: categories,
        numOfPage: numOfPage,
    });
}
// exports.get_searchCategoryBlogPage = async function (req, res, next) {
//     var word = req.param('category').replace(/-/g, ' ');
//     var blogs = await models.BLOG.findAll({
//         attributes: ['uuid', 'title', 'blogimg', 'content', 'description', 'createdAt'],
//         include: [
//             'blog_user',
//             'blog_comment',
//             {
//                 model: models.CATEGORY,
//                 as: 'blog_category',
//                 where: {
//                     name: word,
//                 }
//             }
//         ],
//     });
//     var categories = await models.CATEGORY.findAll({
//         include: ['category_blog']
//     });
//     var tags = await models.TAG.findAll({
//         attributes: ['TEN_TAG']
//     });
//     console.log(blogs);
//     return res.render('blog', {
//         Authenticated: req.isAuthenticated(),
//         user_name: req.isAuthenticated() ? req.user.dataValues.fullName : '',
//         blogs: blogs,
//         tags: tags,
//         categories: categories,
//     });
// }
exports.get_blogDetailPage = async function (req, res, next) {
    var uuid = req.param('uuid');
    var blogs = await models.BLOG.findAll({
        attributes: ['uuid', 'title', 'blogimg', 'content', 'description', 'createdAt'],
        include: ['blog_user', 'blog_comment'],
    });
    var blog = await models.BLOG.findOne({
        //attributes: ['id', 'USERId', 'blogimg', 'title', 'content', 'createdAt'],
        where: { uuid: uuid },
        include: ['blog_user', 'blog_tag']
    });
    var tags = await models.TAG.findAll({
        attributes: ['TEN_TAG']
    });
    var comments = await models.COMMENT.findAll({
        where: { BLOGId: blog.id },
        include: ['comment_user'],
    });
    var categories = await models.CATEGORY.findAll({
        include: ['category_blog']
    });
    req.session.redirectTo = '/blog/' + blog.uuid;
    return res.render('blog_details', {
        Authenticated: req.isAuthenticated(),
        user_name: req.isAuthenticated() ? req.user.dataValues.fullName : '',
        user_email: req.isAuthenticated() ? req.user.dataValues.email : '',
        blog: blog,
        blogs: blogs,
        tags: tags,
        comments: comments,
        categories: categories,
    })
}
exports.post_blogcmDetailPage = async function (req, res, next) {
    var blog = await models.BLOG.findOne({
        //attributes: ['id', 'USERId', 'blogimg', 'title', 'content', 'createdAt'],
        where: { uuid: req.body.bloguuid },
    });
    var user = await models.USER.findOne({
        where: { email: req.body.useremail },
    });
    await models.COMMENT.create({
        BLOGId: blog.id,
        USERId: user.id,
        cmcontent: req.body.comment,
    });
    return res.redirect('/blog/' + req.body.bloguuid);
}
exports.get_contactPage = function (req, res, next) {
    var xacnhan = false;
    req.session.redirectTo = '/contact';
    if (req.isAuthenticated()) {
        xacnhan = true;
        return res.render('contact', {
            title: 'Express',
            Authenticated: xacnhan,
            user_name: req.user.dataValues.fullName,
            user_email: req.user.dataValues.email
        });
    }
    else {
        return res.render('contact', {
            title: 'Express',
            Authenticated: xacnhan
        });
    }
}
exports.get_coursesPage = function (req, res, next) {
    var xacnhan = false;
    req.session.redirectTo = '/courses';
    if (req.isAuthenticated()) {
        xacnhan = true;
        return res.render('courses', {
            title: 'Express',
            Authenticated: xacnhan,
            user_name: req.user.dataValues.fullName,
            user_email: req.user.dataValues.email
        });
    }
    else {
        return res.render('courses', {
            title: 'Express', Authenticated: xacnhan
        });
    }
}

exports.get_profilePage = async function (req, res, next) {
    req.session.redirectTo = '/profile';
    var user = await models.USER.findOne({
        where: {
            email: req.user.email,
        }
    })
    console.log(user);
    return res.render('profile', {
        Authenticated: req.isAuthenticated(),
        user_name: req.isAuthenticated() ? req.user.dataValues.fullName : '',
        user_email: req.isAuthenticated() ? req.user.dataValues.email : '',
        user: user,
    })

}


exports.get_coursesDetailPage = function (req, res, next) {
    var xacnhan = false;
    if (req.isAuthenticated()) {
        xacnhan = true;
        return res.render('coursesdetail', {
            title: 'Express',
            Authenticated: xacnhan,
            user_name: req.user.dataValues.fullName,
            user_email: req.user.dataValues.email
        });
    }
    else {
        return res.render('coursesdetail', {
            title: 'Express', Authenticated: xacnhan
        });
    }
}

exports.get_tkbPage = function (req, res, next) {
    var xacnhan = false;
    if (req.isAuthenticated()) {
        xacnhan = true;
        return res.render('tkb', {
            title: 'Express',
            Authenticated: xacnhan, user_name: req.user.dataValues.fullName,
            user_email: req.user.dataValues.email
        });
    }
    else {
        return res.render('tkb', {
            title: 'Express',
            Authenticated: xacnhan
        });
    }
}

exports.get_resetpwPage = function (req, res, next) {
    var xacnhan = false;
    if (req.isAuthenticated()) {
        xacnhan = true;
        return res.render('resetpw', {
            title: 'Express',
            Authenticated: xacnhan,
            user_name: req.user.dataValues.fullName,
            user_email: req.user.dataValues.email
        });
    }
    else {
        return res.render('resetpw', {
            title: 'Express',
            Authenticated: xacnhan
        });
    }
}

exports.get_booksPage = function (req, res, next) {
    var xacnhan = false;
    if (req.isAuthenticated()) {
        xacnhan = true;
        return res.render('books', {
            title: 'Express',
            Authenticated: xacnhan,
            user_name: req.user.dataValues.fullName,
            user_email: req.user.dataValues.email
        });
    }
    else {
        return res.render('books', {
            title: 'Express',
            Authenticated: xacnhan
        });
    }
}

exports.get_booksdetailPage = function (req, res, next) {
    var xacnhan = false;
    if (req.isAuthenticated()) {
        xacnhan = true;
        return res.render('booksdetail', {
            title: 'Express',
            Authenticated: xacnhan,
            user_name: req.user.dataValues.fullName,
            user_email: req.user.dataValues.email
        });
    }
    else {
        return res.render('booksdetail', {
            title: 'Express',
            Authenticated: xacnhan
        });
    }
}

exports.get_profileEditPage = function (req, res, next) {
    var xacnhan = false;
    if (req.isAuthenticated()) {
        xacnhan = true;
        return res.render('example', {
            title: 'Express',
            Authenticated: xacnhan,
            user_name: req.user.dataValues.fullName,
            user_email: req.user.dataValues.email
        });
    }
    else {
        return res.render('example', {
            title: 'Express',
            Authenticated: xacnhan
        });
    }
}

exports.post_profileEditPage = function (req, res, next) {
    // var xacnhan = false;
    // if (req.isAuthenticated()) {
    //     xacnhan = true;
    //     return res.render('example', { title: 'Express', Authenticated: xacnhan, user_name: req.user.dataValues.fullName, email_user: req.user.dataValues.email });
    // }
    // else { return res.render('example', { title: 'Express', Authenticated: xacnhan }); }
    console.log(req.body)
    console.log(req.session.token)
    models.USER.update(
        {
            fullName: req.body.fullName,
            gender: req.body.gender,
            dob: req.body.dob,
            phonenumber: req.body.phonenumber,
            level: req.body.level,
            country: req.body.country,
            address: req.body.address
        },
        {
            where: {
                email: req.body.email,
            }
        }
    );
    res.send('ok');
}