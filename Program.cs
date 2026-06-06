using TutionApp.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

// තාවකාලිකව ළමයින්ගේ දත්ත මතක තබා ගැනීමට List එකක් (Batch එකද ඇතුළත්ව)
builder.Services.AddSingleton<List<Student>>(new List<Student>
{
    new Student { Id = 1, StudentCode = "Online27-001", StudentName = "Amali Perera", Address = "Colombo", MobileNumber = "0771234567", Batch = "Online 2027", IsPaid = true, HasTute = true, HasWebAccess = false, MonthlyFee = 3000 },
    new Student { Id = 2, StudentCode = "Online27-002", StudentName = "Kasun Silva", Address = "Kandy", MobileNumber = "0719876543", Batch = "Online 2027", IsPaid = false, HasTute = false, HasWebAccess = true, MonthlyFee = 3000 }
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();