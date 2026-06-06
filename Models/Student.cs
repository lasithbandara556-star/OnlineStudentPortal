namespace TutionApp.Models
{
    public class Student
    {
        public int Id { get; set; }
        public string StudentCode { get; set; } = string.Empty; // ළමයාගේ කේතය
        public string StudentName { get; set; } = string.Empty; // ළමයාගේ නම
        public string Address { get; set; } = string.Empty;     // ළමයාගේ ලිපිනය
        public string MobileNumber { get; set; } = string.Empty; // දුරකථන අංකය
        public string Batch { get; set; } = string.Empty;        // ළමයාගේ Batch එක
        public bool IsPaid { get; set; }        // Payment කලාද?
        public bool HasTute { get; set; }       // Tute යැව්වාද?
        public bool HasWebAccess { get; set; }   // Website එකට Access දුන්නද?
        public decimal MonthlyFee { get; set; }  // මාසික ගාස්තුව
    }
}