#!/bin/bash
#SBATCH -J diamond        # Job Name
#SBATCH -o diamond.o%j    # Name of the error and output files (%j appends the jobID)
#SBATCH -N 1             # Requests nodes
#SBATCH -n 15            # Requests number of tasks, in multiples of 64
#SBATCH -p development   # Queue name: development (max 2 hr walltime) or normal
#SBATCH -t 00:30:00      # Run time (hh:mm:ss)
#SBATCH -A TG-MPS150006

module load intel/19.1.1
module load impi/19.0.7
module load mvapich2/2.3.6
module load qe/7.0

eta_list="0.497 0.498 0.499 0.500 0.501 0.502 0.503"
for eta in $eta_list
do
cat > Diamond_iso.$eta.in << EOF
&CONTROL
 calculation = 'relax',
 restart_mode = 'from_scratch',
 prefix='Diamond',
 pseudo_dir='./',
 tstress=.true.,
 tprnfor=.true.,
/
&SYSTEM
 ibrav=0,
 celldm(1)=6.674d0,
 nat=2,
 ntyp=1,
 ecutwfc=40,
 occupations = 'fixed',
/
&ELECTRONS
 conv_thr = 1.0D-8,
 mixing_mode = 'plain',
 mixing_beta = 0.7d0,
 diagonalization = 'cg',
/
&IONS
 ion_dynamics='bfgs',
/
&CELL
 cell_dynamics = 'bfgs',
 press=0.1d0,
/
ATOMIC_SPECIES
C 12.011d0 C_LDA.UPF

ATOMIC_POSITIONS
C 0.d0 0.d0 0.d0
C 0.25d0 0.25d0 0.25d0

K_POINTS automatic
  6 6 6 0 0 0

CELL_PARAMETERS alat 
-$eta 0.d0 $eta
0.d0 $eta $eta
-$eta $eta 0.d0
EOF

pw.x < Diamond_iso.$eta.in > Diamond_iso.$eta.out # Run the executable named pw.x 

done

# rm *.igk *.wfc*
# rm -r *.save


