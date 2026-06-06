using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using TutionApp.Models;

namespace TutionApp.Controllers
{
    public class HomeController : Controller
    {
        private readonly List<Student> _students;

        public HomeController(List<Student> students)
        {
            _students = students;
        }

        public IActionResult Index()
        {
            return View(_students);
        }

        public IActionResult Privacy()
        {
            return View();
        }

        // අලුත් ළමයෙක් ඇතුළත් කිරීමේ කෝඩ් එක (batch එකතු කර ඇත)
        [HttpPost]
        public IActionResult AddStudent(string code, string name, string address, string mobile, string batch, decimal fee)
        {
            if (!string.IsNullOrEmpty(name))
            {
                var newId = _students.Count > 0 ? _students.Max(s => s.Id) + 1 : 1;
                _students.Add(new Student
                {
                    Id = newId,
                    StudentCode = code,
                    StudentName = name,
                    Address = address,
                    MobileNumber = mobile,
                    Batch = batch,           // Batch එක සම්බන්ධ කිරීම
                    MonthlyFee = fee,
                    IsPaid = false,
                    HasTute = false,
                    HasWebAccess = false
                });
            }
            return RedirectToAction("Index");
        }

        [HttpPost]
        public IActionResult UpdateStatus(int id, string type, bool val)
        {
            var student = _students.FirstOrDefault(s => s.Id == id);
            if (student != null)
            {
                if (type == "paid") student.IsPaid = val;
                if (type == "tute") student.HasTute = val;
                if (type == "web") student.HasWebAccess = val;
            }
            return Ok();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}